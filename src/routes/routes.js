import express from "express";
import { fetchColesPrice, fetchWoolworthPrice } from "../helper/fetchApi.js";

const router = express.Router();

// get price
router.get("/price/:store/:searchTerm", async (req, res) => {
  const store = req.params.store.toLowerCase() || "x";
  const searchTerm = req.params.searchTerm;
  let data = [];

  if (store === "woolworths" || store === "all") {
    // await getWoolWorthCookie();
    let woolworthData = await fetchWoolworthPrice(searchTerm);
    // console.log(woolworthData);

    data = [...data, ...woolworthData];
  }
  if (store === "aldi" || store === "all") {
    // data.push("Aldi DATA");
  }
  if (store === "coles" || store === "all") {
    // data.push("Coles DATA");
    let colesData = await fetchColesPrice(searchTerm);
    console.log(colesData);

    // data = [...data, ...colesData];
  }

  res.send({ status: "true", message: "OK", data });
});

export default router;
