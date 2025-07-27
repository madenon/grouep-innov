import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: {type: String,required: true,unique: true,
    },
    code: {type: String,required: true,uppercase: true,unique: true,
    },
    continent: {type: String,required: true,enum: ["Afrique", "Europe", "Amérique", "Asie", "Océanie"],
    },
    flagUrl: {type: String,required: false,
    },
    city: {type: String,required: true,
    },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", countrySchema);
export default Country;
