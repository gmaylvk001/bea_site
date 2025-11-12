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

        for(let [index, row] of rows.entries()) {
        
            const item_code                         = row.item_code.toString().trim();
            let filter_group_name                   = row.filter_group_name.toString().trim();

            let products = await Product.findOne({
                item_code: item_code.trim(),
            });

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

                if(categories) {
                    let groupName = await GroupInfo.findOne({
                        category_slug: categories.category_slug,
                    });
                    filter_group_name = groupName.group_name;
                }else {
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

            const normalizedGroupName = filter_group_name.trim().toLowerCase();

            let filterGroup = await FilterGroup.findOne({
                filtergroup_name: new RegExp(`^${normalizedGroupName}$`, 'i'),
            });


            if (!filterGroup && filterGroup == null) {
                filterGroup = await FilterGroup.create({
                    filtergroup_name: filter_group_name,
                    filtergroup_slug: filter_group_name.toLowerCase().replace(/[^\w\s.-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
                    status: "Active",
                });
            }

            // Check for existing filter correctly
            let existingFilter = await Filter.findOne({
                filter_name: filter_name.trim(),
                filter_group: filterGroup._id,
            });

            // console.log(existingFilter);
    
            if (existingFilter) {
                if (existingFilter.status !== "Active") {
                    existingFilter.status = "Active";
                    await existingFilter.save();
                }
            } else {
                existingFilter =  await Filter.create({
                    filter_name: filter_name.trim(),
                    filter_slug: filter_name.trim().toLowerCase().replace(/[^\w\s.-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
                    filter_group: filterGroup._id,
                    status: "Active",
                });
            }

            // let products = await Product.findOne({
            //     item_code: item_code.trim(),
            // });

            if(products) {
                const product_id = products._id;
                const existFilterVal = await ProductFilter.findOne({
                    product_id: product_id,
                    filter_id: existingFilter._id,
                });

                if(!existFilterVal || existFilterVal == null) {
                    await ProductFilter.create({
                        filter_id: existingFilter._id,
                        product_id: product_id,
                    });
                    addedCount++;
                }else {
                    existCount++;
                }
            }else {
                return NextResponse.json(
                    { error: 'Product Is not Found On this Item_Code!' },
                    { status: 404 }
                )
            }

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

