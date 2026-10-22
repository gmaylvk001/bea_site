import { NextResponse } from 'next/server';
import { join } from 'path';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import { format } from 'date-fns';
import { writeFile } from 'fs/promises';
import Product from "@/models/product";
import Category from  "@/models/ecom_category_info";
import Brand  from "@/models/ecom_brand_info";
import formidable from 'formidable';
import md5 from "md5";
import mongoose from 'mongoose';
import FilterGroup from '@/models/ecom_filter_group_infos';
import Filter from "@/models/ecom_filter_infos";
import ProductFilter from "@/models/ecom_productfilter_info";
import GroupInfo from '@/models/ecom_group_name_info';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req) {
    try {

        const formData  = await req.formData();
        const file      = formData.get('excel');

        if (!file) {
            return NextResponse.json(
                { error: 'Excel or CSV file is required.' },
                { status: 400 }
            );
        }

        const escapeRegex = (text) => {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const fileName  = file.name.toLowerCase();
        const buffer    = Buffer.from(await file.arrayBuffer());
        let rows        = [];

        if (fileName.endsWith('.csv')) {
            const csvText   = buffer.toString('utf-8');
            const workbook  = XLSX.read(csvText, { type: 'string' });
            rows            = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        } else {
            const workbook  = XLSX.read(buffer);
            rows            = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        }

        const errors        = [];
        let addedCount      = 0;
        let existCount      = 0;

        // Phase 1: Validate all rows and collect valid entries
        // Group by product_id + filter_group_id so we can handle multiple filter values per group
        const validEntries = []; // { product, filterGroup, existingFilter, rowIndex }

        for(let [index, row] of rows.entries()) {
        
            const item_code                         = row.item_code.toString().trim();
            let filter_group_name                   = row.filter_group_name.toString().trim();

            let products = await Product.findOne({
                item_code: item_code.trim(),
            });

            if (!products) {
                errors.push({
                    row: index + 2,
                    error: `Product not found: ${item_code}`,
                });
                continue;
            }

            if(filter_group_name == "size") {
                let cat_id_str  = products.sub_category?.trim() || products.category?.trim();

                let cat_id;
                if (mongoose.Types.ObjectId.isValid(cat_id_str)) {
                    cat_id = new mongoose.Types.ObjectId(cat_id_str);
                } else {
                    console.error("Invalid ObjectId:", cat_id_str);
                }

                let categories = await Category.findOne({
                    _id: cat_id,
                });

                if (categories) {
    const groupInfo = await GroupInfo.findOne({
        category_slug: categories.category_slug,
    });

    if (groupInfo && groupInfo.group_name) {
        filter_group_name = groupInfo.group_name;
    } else {
        // fallback if mapping not found
        filter_group_name = "size";
    }
} else {
    filter_group_name = "size";
}

            }

            const filter_name                       = row.filter_name.toString().trim(); 

            if(!filter_group_name || !filter_name) {
                errors.push({
                    row: index + 2,
                    error: "Missing filter_group_name or filter_name",
                });
                continue;
            }

            const normalizedGroupName = filter_group_name.trim();
            const safeRegex = new RegExp(`^${escapeRegex(normalizedGroupName)}$`, 'i');

            const groupSlug = filter_group_name
            .trim()
            .toLowerCase()
            .replace(/[^\w\s.-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

            const filterGroup = await FilterGroup.findOne({
                filtergroup_slug: groupSlug,
            });


if (!filterGroup) {
    errors.push({
        row: index + 2,
        error: `Filter group not found: ${filter_group_name}`,
    });
    continue;
}

const filterSlug = filter_name
  .trim()
  .toLowerCase()
  .replace(/[^\w\s.-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

const existingFilter = await Filter.findOne({
    filter_slug: filterSlug,
    filter_group: filterGroup._id,
});

if (!existingFilter) {
    errors.push({
        row: index + 2,
        error: `Filter not found: ${filter_name}`,
    });
    continue;
}

            // Collect valid entry for Phase 2
            validEntries.push({
                product: products,
                filterGroup: filterGroup,
                existingFilter: existingFilter,
                rowIndex: index,
            });

        }

        // Phase 2: Group valid entries by product_id + filter_group_id
        // Only keep the LAST filter value per product+group (one value per group per product)
        const groupedMap = new Map(); // key: "productId_filterGroupId" -> { product, filterGroup, filterId }

        for (const entry of validEntries) {
            const key = `${entry.product._id.toString()}_${entry.filterGroup._id.toString()}`;
            groupedMap.set(key, {
                product: entry.product,
                filterGroup: entry.filterGroup,
                filterId: entry.existingFilter._id,
            });
        }

        // Phase 3: For each product+group combo, delete old filters in that group and insert the new one
        for (const [key, group] of groupedMap) {
            // Get all filter IDs in this filter group
            const groupFilters = await Filter.find({
                filter_group: group.filterGroup._id,
            }).select('_id');
            const groupFilterIds = groupFilters.map(f => f._id);

            // Delete old filters from this group for this product
            await ProductFilter.deleteMany({
                product_id: group.product._id,
                filter_id: { $in: groupFilterIds },
            });

            // Insert the single new filter value for this product+group
            await ProductFilter.create({
                product_id: group.product._id,
                filter_id: group.filterId,
            });
            addedCount++;
        }

        return NextResponse.json(
            {
                message: `Upload completed: ${addedCount} added, ${existCount} Product Filters Already Exsit.`,
                details: errors,
            },
            { status: errors.length ? 207 : 201 }
        );

    } catch(error) {
        console.error('Bulk update error:', error);
        return NextResponse.json(
            { error: 'Bulk update error: ' + error.message },
            { status: 500 }
        )
    }
}

