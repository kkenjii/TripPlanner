export interface TravelGuideData {
  country: string;
  best_time: string[];
  transportation_tips: string[];
  checklist: {
    summer: string[];
    rainy: string[];
    winter: string[];
  };
  mistakes: string[];
  doNotBring: string[];
}

export const travelGuideDatabase: Record<string, TravelGuideData> = {
  Japan: {
    country: "Japan",
    best_time: [
      "Visit from March to April for cherry blossom season",
      "October to November offers perfect weather and fall foliage",
      "Avoid July to August due to extreme heat and humidity",
      "December to February is cold but less crowded"
    ],
    transportation_tips: [
      "Get a Suica or Pasmo IC card for seamless train and bus travel",
      "The Japan Rail Pass is worth it for multi-city trips",
      "Trains are punctual, frequent, and extensive throughout Japan",
      "Avoid rush hours (8–10 AM, 6–8 PM) on weekdays",
      "Most signs have English in major cities"
    ],
    checklist: {
      summer: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card, Coin purse",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Slip-on shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇯🇵 Japan: IC card (Suica/Pasmo), Small hand towel, Small trash bag",
        "☀️ Summer: Light breathable clothing, Extra shirts, Hat/cap, Cooling towel, Sunscreen"
      ],
      rainy: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card, Coin purse",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Slip-on shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇯🇵 Japan: IC card (Suica/Pasmo), Small hand towel, Small trash bag",
        "🌧️ Rainy: Compact umbrella, Waterproof bag, Quick-dry clothing, Extra socks, Light jacket"
      ],
      winter: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card, Coin purse",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Slip-on shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇯🇵 Japan: IC card (Suica/Pasmo), Small hand towel, Small trash bag",
        "❄️ Winter: Warm jacket, Long sleeves, Thermal layers, Scarf, Gloves, Thermal wear"
      ]
    },
    doNotBring: [
      "❌ Too many clothes — you'll buy souvenirs anyway",
      "❌ Too many toiletries — convenience stores have everything",
      "❌ Heavy luggage — trains and elevators are tight",
      "❌ Too many shoes — one comfortable pair is enough"
    ],
    mistakes: [
      "Don't ignore etiquette — remove shoes indoors and temples",
      "Don't be loud in trains or public spaces",
      "Don't eat while walking",
      "Don't tip — it's not expected",
      "Don't forget to carry cash — many places don't accept cards"
    ]
  },
  "Hong Kong": {
    country: "Hong Kong",
    best_time: [
      "Visit from October to December for cool and dry weather",
      "March to April is also pleasant with mild temperatures",
      "Avoid June to September due to heat, humidity, and typhoon season"
    ],
    transportation_tips: [
      "Use an Octopus Card for MTR, buses, and convenience stores",
      "Take the MTR as the fastest way to get around the city",
      "Avoid rush hours (8–10 AM, 6–8 PM) due to heavy crowds",
      "Use Google Maps for accurate directions and transfers",
      "Taxis are convenient but more expensive than public transport"
    ],
    checklist: {
      summer: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇭🇰 Hong Kong: Octopus Card, Light jacket (strong indoor AC)",
        "☀️ Summer: Light breathable clothing, Extra shirts, Hat/cap, Cooling towel, Sunscreen"
      ],
      rainy: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇭🇰 Hong Kong: Octopus Card, Light jacket (strong indoor AC)",
        "🌧️ Rainy: Compact umbrella, Waterproof bag, Quick-dry clothing, Extra socks"
      ],
      winter: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇭🇰 Hong Kong: Octopus Card, Light jacket (strong indoor AC)",
        "❄️ Winter: Long sleeves, Light jacket, Comfortable clothing"
      ]
    },
    doNotBring: [
      "❌ Too many clothes — shopping malls are everywhere",
      "❌ Too many toiletries — convenience stores are abundant",
      "❌ Heavy luggage — MTR stations have limited elevators",
      "❌ Too many shoes — Hong Kong is very walkable but compact"
    ],
    mistakes: [
      "Don't underestimate humidity — it can be exhausting",
      "Don't skip getting an Octopus Card",
      "Don't assume everything is cheap — Hong Kong can be expensive",
      "Don't rely only on walking — distances can be longer than expected"
    ]
  },
  Thailand: {
    country: "Thailand",
    best_time: [
      "Visit from November to February for cooler and dry weather",
      "March to May is very hot and can be uncomfortable",
      "June to October is rainy season with frequent showers"
    ],
    transportation_tips: [
      "Use Grab app for safe and reliable rides",
      "Take BTS or MRT in Bangkok to avoid traffic",
      "Always agree on price before riding a tuk-tuk",
      "Expect heavy traffic in Bangkok during peak hours",
      "Walking short distances is often faster than driving in traffic"
    ],
    checklist: {
      summer: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇹🇭 Thailand: Sunscreen, Flip flops/sandals, Temple-appropriate outfit, Insect repellent",
        "☀️ Summer: Light breathable clothing, Extra shirts, Hat/cap, Cooling towel"
      ],
      rainy: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇹🇭 Thailand: Sunscreen, Flip flops/sandals, Temple-appropriate outfit, Insect repellent",
        "🌧️ Rainy: Raincoat/poncho, Waterproof bag, Quick-dry clothing, Extra socks, Umbrella"
      ],
      winter: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇹🇭 Thailand: Sunscreen, Flip flops/sandals, Temple-appropriate outfit, Insect repellent",
        "🌤️ Winter: Light clothing (weather still warm), Optional light layer for evenings"
      ]
    },
    doNotBring: [
      "❌ Too many clothes — weather is hot year-round",
      "❌ Too many toiletries — markets have affordable options",
      "❌ Heavy luggage — Thai beaches aren't equipped for large bags",
      "❌ Too many shoes — sandals are primary footwear"
    ],
    mistakes: [
      "Don't fall for tuk-tuk scams — always confirm price",
      "Don't drink tap water",
      "Don't wear revealing clothes in temples",
      "Don't underestimate the heat — stay hydrated",
      "Don't forget cash — many places don't accept cards"
    ]
  },
  Malaysia: {
    country: "Malaysia",
    best_time: [
      "Visit December to February for better weather on the west coast",
      "May to July is also generally favorable",
      "Rainfall varies by region — check specific destination"
    ],
    transportation_tips: [
      "Use Grab app as the primary transport option",
      "Take MRT/LRT for efficient travel in Kuala Lumpur",
      "Avoid relying on taxis — Grab is more reliable",
      "Walking is not always pedestrian-friendly",
      "Plan travel time carefully due to traffic"
    ],
    checklist: {
      summer: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇲🇾 Malaysia: Umbrella, Modest clothing (for mosques), Sunscreen",
        "☀️ Summer: Light breathable clothing, Extra shirts, Hat/cap, Cooling towel"
      ],
      rainy: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇲🇾 Malaysia: Umbrella, Modest clothing (for mosques), Sunscreen",
        "🌧️ Rainy: Waterproof bag, Quick-dry clothing, Extra socks, Raincoat"
      ],
      winter: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇲🇾 Malaysia: Umbrella, Modest clothing (for mosques), Sunscreen",
        "🌤️ Winter: Light clothing (climate generally warm year-round)"
      ]
    },
    doNotBring: [
      "❌ Too many clothes — climate is warm year-round",
      "❌ Too many toiletries — shopping malls everywhere",
      "❌ Heavy luggage — public transport isn't luggage-friendly",
      "❌ Too many shoes — lightweight footwear is ideal"
    ],
    mistakes: [
      "Don't rely only on walking — infrastructure varies",
      "Don't ignore sudden rain showers",
      "Don't assume all areas are tourist-friendly",
      "Don't forget cash for small vendors",
      "Don't underestimate travel time in cities"
    ]
  },
  Philippines: {
    country: "Philippines",
    best_time: [
      "⭐ December to May — Dry season, best for beaches and travel",
      "⭐ March to May — Hottest months (great for islands, but very hot)",
      "⚠️ June to November — Rainy + typhoon season (expect delays)"
    ],
    transportation_tips: [
      "Use Grab for safe and reliable rides in cities",
      "Expect heavy traffic in Metro Manila — plan extra time",
      "Use jeepneys and tricycles for short/local trips",
      "Domestic flights are best for island hopping (PH is an archipelago)",
      "Always confirm fare for tricycles (no fixed pricing)"
    ],
    checklist: {
      summer: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇵🇭 Philippines: Waterproof bag, Extra shirt (very humid), Flip flops/sandals",
        "☀️ Summer (Mar–May): Light breathable clothes, Sunscreen, Hat/cap, Extra shirt (very humid)"
      ],
      rainy: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇵🇭 Philippines: Waterproof bag, Extra shirt (very humid), Flip flops/sandals",
        "🌧️ Rainy Season (Jun–Nov): Umbrella or raincoat, Waterproof bag, Extra socks, Quick-dry clothes"
      ],
      winter: [
        "📋 Base: Passport, Visa, Flight tickets (digital + backup), Hotel bookings",
        "💰 Base: Cash (local currency), Credit/debit card",
        "📱 Base: Phone, Power bank, Charging cables, Universal adapter, eSIM/pocket WiFi",
        "👟 Base: Comfortable walking shoes, Underwear, Socks, Sleepwear",
        "💊 Base: Personal medication, Basic medicine, Wet wipes/tissues",
        "🎒 Base: Reusable shopping bag, Small backpack, Water bottle",
        "🇵🇭 Philippines: Waterproof bag, Extra shirt (very humid), Flip flops/sandals",
        "🌤️ Cool Season (Dec–Feb): Light jacket (especially mornings/nights), Comfortable walking shoes"
      ]
    },
    doNotBring: [
      "❌ Large luggage to small islands — difficult to move around",
      "❌ Too many clothes — weather is tropical year-round",
      "❌ Too many toiletries — available everywhere",
      "❌ Only cards — many places are cash-based"
    ],
    mistakes: [
      "Don't underestimate traffic — always allow extra travel time",
      "Don't rely only on cards — many places are cash-based",
      "Don't drink tap water — stick to bottled water",
      "Don't assume transport is structured — routes can be confusing",
      "Don't ignore weather forecasts — typhoons can disrupt plans",
      "Don't bring large luggage to small islands — difficult to move around"
    ]
  }
};

export function getTravelGuide(country: string): TravelGuideData | null {
  return travelGuideDatabase[country] || null;
}
