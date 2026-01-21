import puppeteer from "puppeteer";
import fs from "fs-extra";
import { shapeWoolworthsData } from "./helper.js";
import Cookie from "../models/cookie.js";

const timeDifference = (pastDate, diff = 10) => {
  const now = new Date();

  // 1. Get difference in milliseconds
  const diffInMs = now - new Date(pastDate);

  // 2. Convert to minutes (ms / 1000 / 60)
  const diffInMinutes = diffInMs / (1000 * 60);

  // 3. Check logic (e.g., is it GREATER than 10 mins?)
  console.log("Time Difference :", diffInMinutes);
  return diffInMinutes >= diff;
};

// Woolworth
// get cookie for woolies
export const getWoolWorthCookie = async () => {
  let cookieObject;
  cookieObject = await Cookie.findOne({ name: "Woolworths" });

  console.log(cookieObject.updatedAt);
  if (!cookieObject || timeDifference(cookieObject?.updatedAt, 20)) {
    console.log("INSIDE");
    console.log("🔵 Launching Browser...");

    // Launch browser.
    // set headless: false if you want to see it happen (helps debugging)
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set a real User-Agent to avoid immediate blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    try {
      console.log("🟡 Navigating to Woolworths...");

      // 1. Go to the homepage
      await page.goto("https://www.woolworths.com.au", {
        waitUntil: "networkidle2", // Wait until network activity settles
        timeout: 60000,
      });

      // 2. Wait a moment for Akamai (Bot Manager) scripts to run and calculate tokens
      console.log("⏳ Waiting for security challenges to resolve...");
      await new Promise((r) => setTimeout(r, 5000));

      // 3. Get all cookies
      const cookies = await page.cookies();

      // 4. Format them into a single Header string: "key=value; key2=value2"
      const cookieString = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      console.log("\n✅ SUCCESS! Here is your Cookie String:\n");
      console.log("---------------------------------------------------");

      cookieObject = await Cookie.findOneAndUpdate(
        { name: "Woolworths" }, // Filter
        { $set: { cookie: cookieString } }, // Update
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true, // Apply schema defaults if creating new
        },
      );

      console.log(cookieObject.updatedAt); // Now you can see when it was saved
      console.log("---------------------------------------------------");
    } catch (error) {
      console.error("❌ Error:", error.message);
      cookieObject = { error: false, message: "Cookie fetch failed" };
    } finally {
      await browser.close();
    }
  }

  return cookieObject;
};

// call woolies api
export const fetchWoolworthPrice = async (searchTerm) => {
  try {
    const payload = {
      Filters: [],
      IsSpecial: false,
      Location: `/shop/search/products?searchTerm=${searchTerm.toLowerCase()}`,
      PageNumber: 1,
      PageSize: 36,
      SearchTerm: searchTerm,
      SortType: "TraderRelevance",
      IsHideEverydayMarketProducts: false,
      IsRegisteredRewardCardPromotion: null,
      ExcludeSearchTypes: ["UntraceableVendors"],
      GpBoost: 0,
      GroupEdmVariants: false,
      EnableAdReRanking: false,
    };

    const cookieObject = await getWoolWorthCookie();

    // 2. FETCH WITH YOUR EXACT HEADERS
    const response = await fetch(
      "https://www.woolworths.com.au/apis/ui/Search/products",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json",
          priority: "u=1, i",
          // "request-id": "|0e4afd697a4d4c478e5cf2714682859d.cc287b42955f4cc2", // Optional: IDs usually auto-generate, but you can keep it
          "sec-ch-ua":
            '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          traceparent:
            "00-0e4afd697a4d4c478e5cf2714682859d-cc287b42955f4cc2-01",
          // IMPORTANT: Inject dynamic referer
          Referer: `https://www.woolworths.com.au/shop/search/products?searchTerm=${searchTerm}`,
          // YOUR COPIED COOKIE STRING
          cookie: cookieObject.cookie,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      // Log the error text (sometimes it's HTML access denied)
      const errorText = await response.text();
      console.error(
        "Woolworths Error:",
        response.status,
        errorText.substring(0, 100),
      );

      return { error: true, message: "No response from Woolworths API" };
    }

    const data = await response.json();
    let shapedData = shapeWoolworthsData(data);
    return shapedData;
  } catch (err) {
    console.log(err.message);
    return { error: true, message: "Failed to fetch data" };
  }
};

// Coles
export const fetchColesPrice = async (searchTerm) => {
  try {
    let response = fetch(
      "https://www.coles.com.au/_next/data/20251218.5-f5f2438ec1bb93c3e008bafbbcc0fd7f137e8a5a/en/search/products.json?q=" +
        searchTerm,
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          baggage:
            "sentry-environment=prod,sentry-release=20251218.5-f5f2438ec1bb93c3e008bafbbcc0fd7f137e8a5a,sentry-public_key=fe929b0cab4a4e3694d4ce2c52b13210,sentry-trace_id=9857c212ea5a4271861dc1bbe2fed5d9,sentry-sample_rate=0.6,sentry-transaction=%2Fsearch%2Fproducts,sentry-sampled=false",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "sentry-trace": "9857c212ea5a4271861dc1bbe2fed5d9-948c8d97271fac72-0",
          "x-nextjs-data": "1",
          cookie:
            "visid_incap_2800108=G7GljIIqTRuxHQ2D0+IjkUNZcGkAAAAAQUIPAAAAAAAo9wjAddOZ+DVAt4MrkNLi; s_rnd=40; ld_user=de6d5def-c0e0-4851-baae-dceac9375aaf; visitorId=6af84e4d-83ca-45c2-9150-38b398e032a5; analyticsIsLoggedIn=false; dsch-visitorid=6f29db74-fcd7-4e65-8472-268e7153c976; incap_ses_974_2800108=enwRNQmGUy3jTNrw3VeEDWbacGkAAAAAxIpfrR6pQDtjCBtobRu8jg==; sessionId=c2547cb2-50fa-4e55-a08c-71c6d4a9b75e; nlbi_2800108_3037207=z4zwfoEvJF1eCWBAQME8pAAAAABiaTsZFKl97B2WvZ/tdkVn; ldUserType=anonymous; at_check=true; nlbi_2800108_2147483392=i1QlKef21FKsgGE4QME8pAAAAADWvSZIn3momt19E7O55vpN; reese84=3:sBZnOf93TQ/33+t0RPK4IA==:9TBtJvKXufKfcpXSD/IpR2FPdwsTB+wN1P6vPYe4Zor7bGt53RNLTu9/teCJCl30clj8Zm5IP6onjK+nwEm1UJT/Cacm91wX1KuZsV7xrDZE5bQ3+YW3xlSLslnLKjz4+DpJ0L8YqGWeuoQHOlHMFC/iRKoubn0hUDRI00aa5ZnvqHSVTkQ7LJslERAL/WiNd4FdmOdqrAjsuxiPWBhN0LAi74SvSwdXFIhhoEBxwRR+SQZLoonHEykJoXZcdnpaR6B8rWBXKbaXFLhFdTh20WSCYSz2lySQQnxtva4KDbdw/9hYYR0RCppUela+yXbEpbOdyBU0UJaxrsYRxHIqJyQj7MJv1uZx92/hWfmLUqBtZu5/H6876voIsD274nptRqWV+Xk5Lwdc5l5gkKKT9it9Wp9cm4KYU4M6KHuDTLQR/6bmaxG6Ipd7Eanw9DtvKTvRcUwFz25izfUFtm3WrPBcFBn5Xdzv0k/ie0pGL7U=:Q78U2p5rixPuOwNUhAiXqS4ivR3H2gwxiui4dvfdV9E=; gpv_page=cusp%3Ahome; s_ips=944; dsch-searchid=fd3c1919-3eab-4d81-b60e-7dc6cd579be5; dsch-sessionid=ff3a4d22-6df9-45cc-85e2-0d757ebceb1f; ad-memory-token=os%2FxlO%2B4mGhkKtE1jSymkFak4DIKRgoMEgoKCDExMDUwMDRQCgwSCgoINTYxMDE3N1AKDBIKCgg0MzA5MTI0UAoMEgoKCDQ4NzMyNTBQEgwI77TDywYQp47l1wMaAggCIgA%3D; asm-guest-id=4XMuZbqIiffaRkhiw73MmqIB4rRZFXaeQehVqBp6IfW9l%2Bj2H%2BkJ8OkpvjNaqbD9HNVkWcXJAdmE8SPI2B%2FQcU254%2FReIbfJIXnsq4UZJwA%3D; nlbi_2800108_2670698=znSNV4UNBiL3BZMgQME8pAAAAAD7E33XD8O4uIRfbEC7Nlvl; mbox=session#36c269f27ced4d969acdc2c616e281eb#1769005514; gpv_pathNode=search%20modal%20loaded",
          Referer: "https://www.coles.com.au/search/products?q=milk",
        },
        body: null,
        method: "GET",
      },
    );

    if (!response.ok) {
      // Log the error text (sometimes it's HTML access denied)
      const errorText = await response.text();
      console.error(
        "Coles Error:",
        response.status,
        errorText.substring(0, 100),
      );

      return { error: true, message: "No response from Coles API" };
    }

    const data = await response.json();
    // let shapedData = shapeWoolworthsData(data);
    return data;
  } catch (err) {
    console.log(err.message);
    return { error: true, message: "Failed to fetch data" };
  }
};
