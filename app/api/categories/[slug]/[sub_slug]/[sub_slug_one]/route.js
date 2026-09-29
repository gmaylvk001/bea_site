import dbConnect from "@/lib/db";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Brand from "@/models/ecom_brand_info"; 
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import CategoryFilter from "@/models/ecom_categoryfilters_infos"; // <-- new import
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    const { slug, sub_slug, sub_slug_one } = await params;

    // Immediately reject invalid or "undefined" / "null" slugs
    if (
      !slug || slug === "undefined" || slug === "null" ||
      !sub_slug || sub_slug === "undefined" || sub_slug === "null" ||
      !sub_slug_one || sub_slug_one === "undefined" || sub_slug_one === "null"
    ) {
      return Response.json({ error: "Invalid category URL" }, { status: 404 });
    }

    await dbConnect();

    // Fetch child, sub, and main categories to validate hierarchy
    const [category, parent, main] = await Promise.all([
      ecom_category_info.findOne({ category_slug: sub_slug_one }),
      ecom_category_info.findOne({ category_slug: sub_slug }),
      ecom_category_info.findOne({ category_slug: slug }),
    ]);

    if (!category || !parent || !main) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    const isChildOfSub = String(category.parentid || "").trim() === String(parent._id);
    const isSubOfMain = String(parent.parentid || "").trim() === String(main._id);
    if (!isChildOfSub || !isSubOfMain) {
      return Response.json({ error: "Category hierarchy mismatch" }, { status: 404 });
    }
    
    // Fetch products under this category
    /*
    const products = await Product.find({
      sub_category: category._id,
      status: "Active" 
    });
*/
    const products = await Product.find({
              status: "Active",
              sub_category_new: { 
                $regex: category.md5_cat_name,
                $options: "i"
              }, quantity: { $gt: 0 }
            });

    if (!products || products.length === 0) {
      return Response.json({ category, products: [], brands: [], filters: [] });
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
    
    
    // ✅ Fetch category-level filters (new logic)
    const categoryFilters = await CategoryFilter.find({
      category_id: category._id,
    });

    const filterIds = [
      ...new Set(categoryFilters.map((cf) => cf.filter_id)),
    ];

    /* const filters = await Filter.find({ _id: { $in: filterIds } })
      .populate({
        path: "filter_group",
        select: "filtergroup_name -_id",
        model: FilterGroup,
      })
      .lean();

    const formattedFilters = filters.map((filter) => ({
      ...filter,
      filter_group_name: filter.filter_group?.filtergroup_name || "No Group",
      filter_group: filter.filter_group?._id,
    })); */

    
    /* // Extract product IDs for filtering
    const productIds = products.map(product => product._id);
    const productFilters = await ProductFilter.find({ product_id: { $in: productIds } });

    // Extract unique filter IDs
    const filterIds = [...new Set(productFilters.map(pf => pf.filter_id))]; */ 
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
    return Response.json({ category, products, brands: brandsWithCount,  filters: formattedFilters });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
