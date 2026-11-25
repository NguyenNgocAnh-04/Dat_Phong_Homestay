const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Tên phòng là bắt buộc"], trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: [true, "Giá là bắt buộc"], min: [1, "Giá phải lớn hơn 0"] },
    capacity: { type: Number, required: [true, "Sức chứa là bắt buộc"], min: [1, "Sức chứa tối thiểu 1"] },
    location: { type: String, required: [true, "Khu vực là bắt buộc"], trim: true },
    address: { type: String, trim: true, default: "" },
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    status: { type: String, enum: ["available", "maintenance"], default: "available" },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ location: 1, price: 1 });
roomSchema.index({ host: 1 });

module.exports = mongoose.model("Room", roomSchema);
