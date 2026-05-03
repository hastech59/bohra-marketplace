"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, Tag, X, ImagePlus } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { vendorApi, aiApi, productsApi } from "@/lib/api";
import { LocationPicker } from "@/components/product/LocationPicker";
import type { Category } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Product name required"),
  description: z.string().min(10, "Description required"),
  price: z.number({ invalid_type_error: "Price required" }).positive("Price must be positive"),
  discount_percent: z.number().min(0).max(90).default(0),
  stock_quantity: z.number({ invalid_type_error: "Stock required" }).int().min(0),
  unit: z.string().min(1, "Unit required"),
  category_id: z.string().uuid("Select a category"),
  tags: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

const UNITS = ["piece", "kg", "gram", "litre", "ml", "box", "dozen", "pack", "set"];

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories().then((r) => r.data as Category[]),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount_percent: 0, tags: [] },
  });

  const tags = watch("tags");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await vendorApi.uploadImage(file);
      setImages((prev) => [...prev, res.data.url]);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateDescription = async () => {
    const name = getValues("name");
    const categoryId = getValues("category_id");
    const price = getValues("price");
    const unit = getValues("unit");
    if (!name || !categoryId) {
      toast.error("Fill in product name and category first");
      return;
    }
    const cat = categories?.find((c) => c.id === categoryId);
    setGeneratingDesc(true);
    try {
      const res = await aiApi.generateDescription({
        product_name: name,
        category: cat?.name || "General",
        price: price || 0,
        unit: unit || "piece",
      });
      setValue("description", res.data.description);
      toast.success("Description generated!");
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSuggestTags = async () => {
    const name = getValues("name");
    const description = getValues("description");
    const categoryId = getValues("category_id");
    if (!name) {
      toast.error("Fill in product name first");
      return;
    }
    const cat = categories?.find((c) => c.id === categoryId);
    setGeneratingTags(true);
    try {
      const res = await aiApi.suggestTags({
        product_name: name,
        description: description || "",
        category: cat?.name || "General",
      });
      setValue("tags", res.data.tags);
      toast.success("Tags suggested!");
    } catch {
      toast.error("Failed to suggest tags");
    } finally {
      setGeneratingTags(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setValue("tags", [...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setValue("tags", tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await vendorApi.createProduct({
        ...data,
        images,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      toast.success("Product created!");
      router.push("/products");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to create product");
    }
  };

  // Flat list of all categories for select
  const allCategories = categories?.filter((c) => c.parent_id) ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary-500">Add New Product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Product Images</h2>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || images.length >= 5}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-400 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              <span className="text-xs mt-1">Add</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          <p className="text-xs text-gray-400 mt-2">Up to 5 images, max 5 MB each</p>
        </div>

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Product Details</h2>

          <div>
            <label className="label">Product Name *</label>
            <input {...register("name")} className="input" placeholder="e.g. Homemade Mango Pickle" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Description *</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingDesc}
                className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium"
              >
                {generatingDesc ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Generate
              </button>
            </div>
            <textarea
              {...register("description")}
              className="input resize-none"
              rows={4}
              placeholder="Describe your product…"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Category *</label>
            <select {...register("category_id")} className="input">
              <option value="">Select category…</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Price (₹) *</label>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Discount %</label>
              <input
                {...register("discount_percent", { valueAsNumber: true })}
                type="number"
                min="0"
                max="90"
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Stock *</label>
              <input
                {...register("stock_quantity", { valueAsNumber: true })}
                type="number"
                min="0"
                className="input"
                placeholder="0"
              />
              {errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{errors.stock_quantity.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Unit *</label>
            <select {...register("unit")} className="input">
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Tags</h2>
            <button
              type="button"
              onClick={handleSuggestTags}
              disabled={generatingTags}
              className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium"
            >
              {generatingTags ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
              AI Suggest Tags
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              className="input flex-1 text-sm"
              placeholder="Add a tag and press Enter"
            />
            <button type="button" onClick={addTag} className="btn-outline px-3 py-2 text-sm">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="badge bg-primary-100 text-primary-700 flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Product Location (optional)</h2>
          <p className="text-xs text-gray-500 mb-3">
            Set a location to appear in nearby product searches. Defaults to your business location.
          </p>
          <LocationPicker
            latitude={location?.lat}
            longitude={location?.lng}
            onChange={(lat, lng) => setLocation({ lat, lng })}
            height="250px"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline flex-1 py-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}
