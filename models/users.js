// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models

module.exports = (mongoose, Mongoose) => {
  // This section contains the properties of your model, mapped to your collection's properties.
  // Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
  const schema = Mongoose.Schema(
    {
      email: { unique: true, type: String, required: true },
      account: {
        firstName: { required: true, type: String },
        lastName: { type: String, default: "" },
        sex: { type: String, default: "" },
        birthDate: { type: String, default: "" },
        avatar: { type: Mongoose.Schema.Types.Mixed, default: {} },
      },
      newsletter: Boolean,
      emailConfirm: Boolean,
      firstConnection: Boolean,
      token: String,
      hash: String,
      salt: String,
      lists: [{ type: Mongoose.Schema.Types.ObjectId, ref: "lists" }],
      friends: [{ type: Mongoose.Schema.Types.ObjectId, ref: "users" }],
    },
    {
      timestamps: false,
    }
  );

  return mongoose.model("users", schema, "users");
};
