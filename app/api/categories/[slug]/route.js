import dbConnect from "@/lib/db";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info"; 
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import CategoryFilter from "@/models/ecom_categoryfilters_infos"; // <-- new import
import mongoose from "mongoose";

async function getCategoryTree(parentId) {
  const categories = await ecom_category_info.find({ parentid: parentId }).lean();
  for (const category of categories) {
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

    // Collect all category IDs
    function getAllCategoryIds(categories) {
      return categories.reduce((acc, category) => {
        acc.push(category._id);
        if (category.subCategories?.length > 0) {
          acc.push(...getAllCategoryIds(category.subCategories));
        }
        return acc;
      }, []);
    }
    const allCategoryIds = getAllCategoryIds(categoryTree);

    // Fetch products in category/subcategories
    /*
    const products = await Product.find({
      sub_category: { $in: allCategoryIds },
      status: "Active"
    });
    */
    const products = await Product.find({
      status: "Active",
      sub_category_new: { 
        $regex: main_category.md5_cat_name,
        $options: "i"
      }, quantity: { $gt: 0 }
    });

    if (!products || products.length === 0) {
      return Response.json({ category: categoryTree, products: [], brands: [], filters: [] });
    }

    // ✅ Fetch brand info & count
    const brandIds = [
      ...new Set(
        products
          .map((p) => p.brand)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      ),
    ];

    let brandsWithCount = [];
    if (brandIds.length > 0) {
      const brands = await Brand.find({ _id: { $in: brandIds } });
      const brandCountMap = products.reduce((acc, product) => {
        const brandId = product.brand?.toString();
        if (brandId) acc[brandId] = (acc[brandId] || 0) + 1;
        return acc;
      }, {});
      brandsWithCount = brands.map((b) => ({
        ...b.toObject(),
        count: brandCountMap[b._id.toString()] || 0,
      }));
    }

    // ✅ Fetch category-level filters (new logic)
    const categoryFilters = await CategoryFilter.find({
      category_id: main_category._id,
    });

    const filterIds = [
      ...new Set(categoryFilters.map((cf) => cf.filter_id)),
    ];

    const filters = await Filter.find({ _id: { $in: filterIds } })
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
    }));

    return Response.json({
      main_category,
      category: categoryTree,
      allCategoryIds,
      products,
      brands: brandsWithCount,
      filters: formattedFilters,
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
