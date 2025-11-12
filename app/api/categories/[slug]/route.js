import dbConnect from "@/lib/db";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Brand from "@/models/ecom_brand_info"; 
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

async function getCategoryTree(parentId) {
  const categories = await ecom_category_info.find({ parentid: parentId }).lean();
  
  for (const category of categories) {
    // Recursively fetch subcategories and assign directly to the category object
    category.subCategories = await getCategoryTree(category._id);
  }
  
  return categories;
}


export async function GET(request, { params }) {
  try {
    await dbConnect();

  const { slug } = await params;
    
    // Fetch main category
    const main_category = await ecom_category_info.findOne({ category_slug: slug });
    if (!main_category) {
      return Response.json({ error: "Main Category not found" }, { status: 404 });
    }

    // Get full category tree
    const categoryTree = await getCategoryTree(main_category._id);
    
    function getAllCategoryIds(categories) {
      return categories.reduce((acc, category) => {
        acc.push(category._id);
        console.log(category.subCategories);
        if (category.subCategories?.length > 0) {
      
          acc.push(...getAllCategoryIds(category.subCategories));
        }
        return acc;
      }, []);
    }
    
    // In your GET handler
    const allCategoryIds = getAllCategoryIds(categoryTree);
    const products = await Product.find({
      sub_category: { $in: allCategoryIds },
      status: "Active"
    });
    
    if (!products || products.length === 0) {
      return Response.json({ category:categoryTree, products: [], brands: [], filters: [] });
    }
    
   // ✅ 3. Extract valid brand IDs (skip empty/null)
       const brandIds = [
         ...new Set(
           products
             .map((p) => p.brand)
             .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
         ),
       ];
       let brandsWithCount = [];
       if (brandIds.length > 0) {
         // Fetch valid brands only
         const brands = await Brand.find({ _id: { $in: brandIds } });
          // Count products per brand
         const brandCountMap = products.reduce((acc, product) => {
           const brandId = product.brand?.toString();
           if (brandId) acc[brandId] = (acc[brandId] || 0) + 1;
           return acc;
         }, {});
   
         // Attach count to each brand
         brandsWithCount = brands.map((b) => ({
           ...b.toObject(),
           count: brandCountMap[b._id.toString()] || 0,
         }));
       }
    
    // Extract product IDs for filtering
    const productIds = products.map(product => product._id);
    const productFilters = await ProductFilter.find({ product_id: { $in: productIds } });

    //  // Count products per brand
    // const brandCountMap = products.reduce((acc, product) => {
    //   const brandId = product.brand?.toString();
    //   if (brandId) {
    //     acc[brandId] = (acc[brandId] || 0) + 1;
    //   }
    //   return acc;
    // }, {});

    // // Attach count to brands
    // const brandsWithCount = brands.map(b => ({
    //   ...b.toObject(),
    //   count: brandCountMap[b._id.toString()] || 0
    // }));
    
    // Extract unique filter IDs
    const filterIds = [...new Set(productFilters.map(pf => pf.filter_id))];
    const filters = await Filter.find({ _id: { $in: filterIds } }).populate({
            path: 'filter_group',
            select: 'filtergroup_name -_id',
            model: FilterGroup
          })
          .lean();
    // Add filter_group_name to filters
    const enrichedFilters = filters.map(filter => ({
        ...filter,
        filtergroup_name: filter.filter_group?.filtergroup_name || "Unknown"
      }));

      const formattedFilters = filters.map(filter => ({
        ...filter,
        filter_group_name: filter.filter_group?.filtergroup_name || 'No Group',
        filter_group: filter.filter_group?._id // Keep original ID
      }));
    return Response.json({ category:categoryTree,allCategoryIds, products, brands: brandsWithCount, filters: formattedFilters,main_category });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });;
  }
}
