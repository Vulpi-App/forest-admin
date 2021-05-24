// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models

module.exports = (mongoose, Mongoose) => {
  // This section contains the properties of your model, mapped to your collection's properties.
  // Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
  const schema = Mongoose.Schema(
    {
      title: { type: String, required: true },
      emoji: String,
      owner: { type: Mongoose.Schema.Types.ObjectId, ref: "users" },
      products: [
        {
          reference: { type: Mongoose.Schema.Types.ObjectId, ref: "products" },
          quantity: String,
          brand: String,
          shop: String,
          price: String,
          added: Boolean,
        },
      ],
    },
    {
      timestamps: false,
    }
  );

  return mongoose.model("lists", schema, "lists");
};
