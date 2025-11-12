import { NextResponse } from 'next/server';
import { join } from 'path';
import path from 'path';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { format } from 'date-fns';
import { writeFile } from 'fs/promises';
import Product from "@/models/product";
import Product_all from "@/models/Product_all";
import Category from  "@/models/ecom_category_info";
import Brand  from "@/models/ecom_brand_info";
import md5 from "md5";
import mongoose from 'mongoose';
import Filter from "@/models/ecom_filter_infos";
import ProductFilter from "@/models/ecom_productfilter_info";

export const config = {
    api: {
      bodyParser: false,
    },
  };

export async function POST(req) {
  try {
    const body = await req.json();
    const stockItems = body.stock;

    if (!Array.isArray(stockItems)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'allstock');
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const filename = `stock_${Date.now()}.json`;
    fs.writeFileSync(path.join(filePath, filename), JSON.stringify(body, null, 2));

    if (!mongoose.connection.readyState) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    for (const item of stockItems) {
        const existingProduct = await Product.findOne({
            item_code: item.name,
        });
        const existingBrand = await Brand.findOne({  brand_name: { $regex: new RegExp(`^${item.brand}$`, "i") } });
        const brand_id = existingBrand?._id?.toString() || null;
        console.log(item.brand,existingBrand,brand_id);
        if (existingProduct) {
            // await Product.updateOne(
            //     {
            //      item_code: item.name 
            //     },
            //     {
            //         $set: {
            //             price: parseFloat(item.MRP),
            //             special_price: parseFloat(item.SellingPrice),
            //             quantity: parseFloat(item.stock),
            //             movement: item.movement,
            //         },
            //     }
                
            // );
              const updateFields = {
                  price: parseFloat(item.MRP),
                  special_price: parseFloat(item.SellingPrice),
                  quantity: parseFloat(item.stock),
                  // movement: item.movement,
              };
              if(brand_id) {
                  updateFields['brand'] = brand_id;
              }
              await Product.updateOne(
                  {
                    item_code: item.name 
                  },
                  { $set: updateFields }
                  
              );
        }
        // else{
          if(item.Status == 'Yes'){
            const existingProductall = await Product_all.findOne({
                item_code: item.name,
            });
            if (existingProductall) {
                await Product_all.updateOne(
                    {
                    item_code: item.name 
                    },
                    {
                        $set: {
                            price: parseFloat(item.MRP),
                            special_price: parseFloat(item.SellingPrice),
                            quantity: parseFloat(item.stock),
                            brand : item.brand
                            // movement: item.movement,
                        },
                    }
                    
                );
            }else{
                await Product_all.create({
                    item_code: item.name,
                    price: parseFloat(item.MRP),
                    special_price: parseFloat(item.SellingPrice),
                    quantity: parseFloat(item.stock),
                    brand   : item.brand,
                    // movement: item.movement,
                });

            }
          } else if(item.Status == 'No'){
            const existingProductall = await Product_all.findOne({
                item_code: item.name,
            });
            if(existingProductall){
            await Product_all.deleteOne({ item_code: item.name });
            }
          }

        // }
    }


    return NextResponse.json({
      message: 'Stock items processed successfully',
    });
  } catch (error) {
    console.error('Sap Items Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload: ' + error.message },
      { status: 500 }
    );
  }
}