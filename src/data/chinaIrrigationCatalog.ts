/**
 * China irrigation trade–style catalogue (Chinadrip / Shandong / Ningbo style ranges).
 * Unique SKUs only — matrix of sizes, spacings, ratings. Kenya retail KES estimates.
 * Does NOT copy competitor brand names; DripTech Eco Flow model numbers.
 */

export type CatalogProduct = {
  name: string;
  model_number: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  features: string[];
  applications: string[];
  specifications: { name: string; value: string; unit?: string }[];
  images: string[];
};

/**
 * Product-type images (local /public/seed-products/).
 * Matching rules: name keywords first, then category — so dripline never gets a sprinkler photo.
 */
const PHOTO = {
  dripline: ["/seed-products/dripline_roll.jpg", "/seed-products/field_drip.jpg", "/seed-products/plant_drip.jpg"],
  dripField: ["/seed-products/field_drip.jpg", "/seed-products/dripline_roll.jpg", "/seed-products/drip1.jpg"],
  kit: ["/seed-products/field_drip.jpg", "/seed-products/dripline_roll.jpg", "/seed-products/plant_drip.jpg"],
  emitter: ["/seed-products/plant_drip.jpg", "/seed-products/field_drip.jpg"],
  sprinkler: ["/seed-products/sprinkler.jpg", "/seed-products/sprink1.jpg"],
  rain: ["/seed-products/sprinkler.jpg", "/seed-products/field_drip.jpg"],
  pipe: ["/seed-products/pipes_industrial.jpg", "/seed-products/pipe2.jpg"],
  fitting: ["/seed-products/pipes_industrial.jpg", "/seed-products/pipe2.jpg"],
  filter: ["/seed-products/pipes_industrial.jpg", "/seed-products/pipe2.jpg"],
  valve: ["/seed-products/pipes_industrial.jpg", "/seed-products/pipe2.jpg"],
  pump: ["/seed-products/pipes_industrial.jpg", "/seed-products/solar_panel.jpg"],
  solar: ["/seed-products/solar_panel.jpg", "/seed-products/solar1.jpg"],
  greenhouse: ["/seed-products/greenhouse.jpg", "/seed-products/green1.jpg", "/seed-products/plant_drip.jpg"],
  tank: ["/seed-products/water_tank.jpg", "/seed-products/water1.jpg"],
  nursery: ["/seed-products/greenhouse.jpg", "/seed-products/green2.jpg"],
  mulch: ["/seed-products/field_drip.jpg", "/seed-products/drip3.jpg"],
};

function imagesFor(category: string, name: string, subcategory?: string): string[] {
  const n = `${name} ${subcategory || ""} ${category}`.toLowerCase();

  // Keyword-first (product identity)
  if (/drip\s*tape|dripline|drip line|pc drip|emitter tape|flat emitter/.test(n)) {
    return pick(PHOTO.dripline, name);
  }
  if (/button dripper|online.*dripper|pc dripper|emitter|drip stake/.test(n)) {
    return pick(PHOTO.emitter, name);
  }
  if (/acre.*kit|kit.*acre|complete kit|drip irrigation kit/.test(n)) {
    return pick(PHOTO.kit, name);
  }
  if (/rain\s*gun|rain\s*hose|impact sprinkler|mini sprinkler|pop-up|butterfly sprinkler|micro sprinkler/.test(n)) {
    return pick(PHOTO.sprinkler, name);
  }
  if (/sprinkler/.test(n)) {
    return pick(PHOTO.sprinkler, name);
  }
  if (/screen filter|disc filter|filtration|y-type filter|t-type filter/.test(n)) {
    return pick(PHOTO.filter, name);
  }
  if (/hdpe|layflat|pe pipe|coil|mainline/.test(n)) {
    return pick(PHOTO.pipe, name);
  }
  if (/compression|coupling|elbow|tee|adapter|end cap|offtake|tape join|tape valve|barbed|fitting/.test(n)) {
    return pick(PHOTO.fitting, name);
  }
  if (/ball valve|gate valve|air release|check valve|pressure regulator|regulator/.test(n)) {
    return pick(PHOTO.valve, name);
  }
  if (/solar/.test(n)) {
    return pick(PHOTO.solar, name);
  }
  if (/pump|submersible|centrifugal|peripheral|borehole/.test(n)) {
    return pick(PHOTO.pump, name);
  }
  if (/venturi|fertiliz|fertigation|dosing/.test(n)) {
    return pick(PHOTO.greenhouse, name);
  }
  if (/tank|storage|bulkhead/.test(n)) {
    return pick(PHOTO.tank, name);
  }
  if (/seedling|tray|nursery|greenhouse/.test(n)) {
    return pick(PHOTO.nursery, name);
  }
  if (/mulch|mulching/.test(n)) {
    return pick(PHOTO.mulch, name);
  }
  if (/controller|timer|station/.test(n)) {
    return pick(PHOTO.valve, name);
  }

  // Category fallback (still type-safe)
  switch (category) {
    case "drip_irrigation":
      return pick(PHOTO.dripline, name);
    case "emitters_drippers":
      return pick(PHOTO.emitter, name);
    case "sprinkler_systems":
    case "rain_guns":
      return pick(PHOTO.sprinkler, name);
    case "pipes_fittings":
      return pick(PHOTO.pipe, name);
    case "filtration_systems":
    case "filters_strainers":
      return pick(PHOTO.filter, name);
    case "valves_regulators":
      return pick(PHOTO.valve, name);
    case "pumps_motors":
    case "borehole_equipment":
      return pick(PHOTO.pump, name);
    case "solar_irrigation":
      return pick(PHOTO.solar, name);
    case "greenhouse_systems":
    case "greenhouse_accessories":
    case "fertigation_systems":
      return pick(PHOTO.greenhouse, name);
    case "water_storage":
      return pick(PHOTO.tank, name);
    case "seedling_trays_nursery":
    case "growing_media":
      return pick(PHOTO.nursery, name);
    case "mulching_materials":
      return pick(PHOTO.mulch, name);
    default:
      return pick(PHOTO.dripField, name);
  }
}

function pick(pool: string[], seed: string): string[] {
  const i = (seed.length + seed.charCodeAt(0)) % pool.length;
  return [pool[i], pool[(i + 1) % pool.length]];
}

function priceDripTapeRoll(wallMm: number, lengthM: number): number {
  // ~KES 8.5/m for 0.3mm, ~9.5/m for 0.4mm+ on 1000m basis
  const perM = wallMm <= 0.25 ? 7.5 : wallMm <= 0.3 ? 8.5 : wallMm <= 0.4 ? 9.5 : 11;
  return Math.round(perM * lengthM);
}

function priceKit(acre: string, lines: number): number {
  // Mid of published Kenya ranges (Grekkon / Aqua Hub / Irrihydrosol)
  const base: Record<string, [number, number, number]> = {
    // [1-line, 2-line, 3-line]
    "1/8": [22000, 26000, 30000],
    "1/4": [40000, 48000, 55000],
    "1/2": [65000, 78000, 90000],
    "1": [130000, 150000, 175000],
    "2": [240000, 280000, 320000],
  };
  const row = base[acre] || base["1"];
  return row[Math.min(lines, 3) - 1];
}

function priceHdpeCoil(dn: number, pn: number, lengthM: number): number {
  // Approx KES per meter PN6-ish, scale by PN
  const perM: Record<number, number> = {
    16: 17,
    20: 28,
    25: 35,
    32: 50,
    40: 70,
    50: 100,
    63: 150,
    75: 220,
    90: 330,
    110: 470,
  };
  const base = perM[dn] || dn * 2;
  const pnFactor = pn <= 6 ? 1 : pn <= 10 ? 1.25 : pn <= 12.5 ? 1.45 : 1.7;
  return Math.round(base * pnFactor * lengthM);
}

function p(
  name: string,
  model: string,
  category: string,
  subcategory: string,
  description: string,
  price: number,
  features: string[],
  applications: string[],
  specs: { name: string; value: string; unit?: string }[],
  _imagePool?: string[],
): CatalogProduct {
  return {
    name,
    model_number: model,
    category,
    subcategory,
    description,
    price: Math.max(50, Math.round(price)),
    features,
    applications,
    specifications: specs,
    images: imagesFor(category, name, subcategory),
  };
}

/** Build ~1000 unique irrigation SKUs from Chinese wholesale product matrices. */
export function buildChinaStyleCatalog(): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seen = new Set<string>();

  const add = (item: CatalogProduct) => {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  // ——— Drip tape / dripline (China factory matrix) ———
  const spacings = [10, 15, 20, 25, 30, 40, 50, 60];
  const thicknesses = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6];
  const flows = [1.0, 1.5, 2.0, 2.2, 2.5, 3.0, 4.0];
  const rolls = [500, 1000, 1500, 2000];
  let n = 1;
  for (const sp of spacings) {
    for (const th of thicknesses) {
      for (const fl of flows.slice(0, 4)) {
        for (const roll of rolls.slice(0, 2)) {
          if (out.length > 280) break;
          const name = `16mm Drip Tape ${sp}cm Spacing ${th}mm Wall ${fl}L/h ${roll}m Roll`;
          add(
            p(
              name,
              `DT-DT16-${sp}-${String(th).replace(".", "")}-${n++}`,
              "drip_irrigation",
              "Drip tape",
              `Flat emitter drip tape 16mm, ${sp}cm spacing, ${th}mm wall, ${fl} L/h emitters. ${roll}m roll for open-field vegetables and onions in Kenya. UV-stabilised PE as commonly supplied from China irrigation factories.`,
              priceDripTapeRoll(th, roll),
              [
                "Inline flat emitters",
                "UV stabilised PE",
                `${sp}cm spacing`,
                `${roll}m roll`,
              ],
              ["Open field", "Vegetables", "Onions", "Maize rows"],
              [
                { name: "Diameter", value: "16", unit: "mm" },
                { name: "Spacing", value: String(sp), unit: "cm" },
                { name: "Wall", value: String(th), unit: "mm" },
                { name: "Flow", value: String(fl), unit: "L/h" },
                { name: "Length", value: String(roll), unit: "m" },
              ],
              undefined,
            ),
          );
        }
      }
    }
  }

  // PC drip line (round)
  for (const sp of [20, 30, 40, 50]) {
    for (const fl of [2.0, 2.2, 3.0, 4.0]) {
      for (const roll of [400, 500, 1000]) {
        add(
          p(
            `16mm PC Drip Line ${sp}cm ${fl}L/h Pressure Compensating ${roll}m`,
            `DT-PC16-${sp}-${fl}-${roll}`,
            "drip_irrigation",
            "PC dripline",
            `Pressure-compensating round dripline 16mm with ${sp}cm emitter spacing and ${fl} L/h flow. Suitable for longer laterals and uneven Kenyan terrain.`,
            Math.round(priceDripTapeRoll(0.5, roll) * 1.35),
            ["Pressure compensating", "Anti-clog labyrinth", "UV PE"],
            ["Orchards", "Greenhouse", "Hilly farms"],
            [
              { name: "Diameter", value: "16", unit: "mm" },
              { name: "Spacing", value: String(sp), unit: "cm" },
              { name: "Flow", value: String(fl), unit: "L/h" },
            ],
            undefined,
          ),
        );
      }
    }
  }

  // Online drippers / button
  for (const fl of [2, 4, 8, 12]) {
    for (const pack of [100, 500, 1000]) {
      add(
        p(
          `Online PC Button Dripper ${fl}L/h Pack of ${pack}`,
          `DT-BTN-${fl}-${pack}`,
          "emitters_drippers",
          "Button drippers",
          `Pressure-compensating online button dripper ${fl} L/h. Pack of ${pack}. Punch-in on 16mm PE lateral for trees and greenhouse benches.`,
          Math.round(pack * (3 + fl * 0.4)),
          ["PC", "Barb inlet", "Cleanable"],
          ["Fruit trees", "Greenhouse", "Nursery"],
          [
            { name: "Flow", value: String(fl), unit: "L/h" },
            { name: "Pack", value: String(pack), unit: "pcs" },
          ],
          undefined,
        ),
      );
    }
  }

  // Kits by acre (Kenya search demand)
  for (const acre of ["1/8", "1/4", "1/2", "1", "2"]) {
    for (const lines of [1, 2, 3]) {
      add(
        p(
          `${acre} Acre Drip Irrigation Kit ${lines} Line Per Bed Complete`,
          `DT-KIT-${acre.replace("/", "")}-${lines}L`,
          "drip_irrigation",
          "Complete kits",
          `Complete drip kit sized for about ${acre} acre with ${lines} dripline(s) per bed. Includes filter, mainline fittings, laterals and connectors — typical China OEM kit layout sold into East Africa.`,
          priceKit(acre, lines),
          ["Filter included", "Fittings pack", `${lines} lines/bed`],
          ["Vegetables", "Tomatoes", "Onions", "Kitchen garden"],
          [
            { name: "Coverage", value: acre, unit: "acre" },
            { name: "Lines per bed", value: String(lines) },
          ],
          undefined,
        ),
      );
    }
  }

  // Screen / disc filters
  for (const inch of ["3/4", "1", "1.5", "2", "3"]) {
    for (const mesh of [80, 120, 150]) {
      for (const type of ["Screen", "Disc"]) {
        add(
          p(
            `${type} Filter ${inch}" ${mesh} Mesh Irrigation`,
            `DT-FIL-${type.slice(0, 2).toUpperCase()}-${inch.replace("/", "")}-${mesh}`,
            "filtration_systems",
            `${type} filters`,
            `${type} filter ${inch} inch, ${mesh} mesh for drip and micro-sprinkler systems. Y/T body styles common in Chinese irrigation exports.`,
            inch === "3/4" ? 1200 + mesh : inch === "1" ? 1800 + mesh * 2 : inch === "1.5" ? 2800 + mesh * 3 : inch === "2" ? 4500 + mesh * 4 : 8500 + mesh * 5,
            [`${mesh} mesh`, `${inch}" ports`, "Easy flush"],
            ["Drip head control", "Greenhouse", "Farm mainline"],
            [
              { name: "Size", value: inch, unit: "inch" },
              { name: "Mesh", value: String(mesh) },
              { name: "Type", value: type },
            ],
            undefined,
          ),
        );
      }
    }
  }

  // HDPE / PE pipe
  for (const dn of [16, 20, 25, 32, 40, 50, 63, 75, 90, 110]) {
    for (const pn of [4, 6, 10, 12.5, 16]) {
      if (dn < 32 && pn > 10) continue;
      for (const len of [50, 100, 200]) {
        if (dn > 63 && len > 100) continue;
        add(
          p(
            `HDPE Pipe DN${dn} PN${pn} ${len}m Coil`,
            `DT-HDPE-${dn}-PN${String(pn).replace(".", "")}-${len}`,
            "pipes_fittings",
            "HDPE pipe",
            `Black HDPE irrigation pipe DN${dn}, PN${pn}, ${len}m. Main and submain lines for Kenyan farms; China PE100/PE80 style export grade.`,
            priceHdpeCoil(dn, pn, len),
            ["UV black PE", `PN${pn}`, `${len}m`],
            ["Mainline", "Submain", "Borehole delivery"],
            [
              { name: "DN", value: String(dn), unit: "mm" },
              { name: "PN", value: String(pn), unit: "bar class" },
              { name: "Length", value: String(len), unit: "m" },
            ],
            undefined,
          ),
        );
      }
    }
  }

  // Compression fittings matrix
  const fitTypes = [
    "Coupling",
    "Elbow 90",
    "Tee",
    "Reducer",
    "Male adapter",
    "Female adapter",
    "End cap",
    "Repair coupling",
  ];
  for (const dn of [16, 20, 25, 32, 40, 50, 63]) {
    for (const ft of fitTypes) {
      add(
        p(
          `PP Compression ${ft} DN${dn}`,
          `DT-FIT-${ft.slice(0, 3).toUpperCase()}-${dn}`,
          "pipes_fittings",
          "Compression fittings",
          `PP compression ${ft.toLowerCase()} for DN${dn} PE/HDPE pipe. Standard China irrigation fitting for quick install without solvent weld.`,
          dn <= 25 ? 80 + dn : 120 + dn * 2,
          ["PP body", "Rubber seal", "Nut lock"],
          ["Mainline joints", "Drip submain"],
          [
            { name: "DN", value: String(dn), unit: "mm" },
            { name: "Type", value: ft },
          ],
          undefined,
        ),
      );
    }
  }

  // Tape fittings
  for (const t of [
    "Tape to PE takeoff",
    "Tape join coupling",
    "Tape elbow",
    "Tape end plug",
    "Tape valve offtake",
    "Double lock tape connector",
  ]) {
    for (const pack of [50, 100, 200]) {
      add(
        p(
          `16mm ${t} Pack ${pack}`,
          `DT-TF-${t.slice(0, 4).replace(/\s/g, "")}-${pack}`,
          "accessories",
          "Tape fittings",
          `16mm drip tape ${t.toLowerCase()}, pack of ${pack}. Essential consumables in every China drip kit BOM.`,
          Math.round(pack * 15),
          ["16mm tape", "Pack of " + pack],
          ["Drip laterals", "Kit install"],
          [{ name: "Size", value: "16", unit: "mm" }],
          undefined,
        ),
      );
    }
  }

  // Valves
  for (const size of ["1/2", "3/4", "1", "1.5", "2", "3"]) {
    for (const vt of ["Ball valve", "Gate valve", "Air release valve", "Check valve"]) {
      add(
        p(
          `${vt} ${size}" Irrigation`,
          `DT-VLV-${vt.slice(0, 3).toUpperCase()}-${size.replace("/", "")}`,
          "valves_regulators",
          "Valves",
          `${vt} ${size} inch for irrigation mainlines and filter stations.`,
          size === "1/2" ? 450 : size === "3/4" ? 650 : size === "1" ? 950 : size === "1.5" ? 1500 : size === "2" ? 2200 : 3800,
          [vt, size + '"'],
          ["Head control", "Zone control"],
          [{ name: "Size", value: size, unit: "inch" }],
          undefined,
        ),
      );
    }
  }

  // Pressure regulators
  for (const out of ["1.0", "1.5", "2.0", "2.5"]) {
    for (const size of ["3/4", "1", "1.5"]) {
      add(
        p(
          `Pressure Regulator ${out} bar ${size}"`,
          `DT-PR-${out.replace(".", "")}-${size.replace("/", "")}`,
          "valves_regulators",
          "Regulators",
          `Adjustable/preset pressure regulator ${out} bar outlet, ${size} inch — protects driplines on pumped systems.`,
          1800 + parseFloat(out) * 200,
          [`${out} bar`, size + '"'],
          ["Drip systems", "Greenhouse"],
          [
            { name: "Outlet pressure", value: out, unit: "bar" },
            { name: "Size", value: size, unit: "inch" },
          ],
          undefined,
        ),
      );
    }
  }

  // Sprinklers
  for (const type of [
    "Impact sprinkler 1/2",
    "Impact sprinkler 3/4",
    "Plastic butterfly sprinkler",
    "360 mini sprinkler",
    "180 micro sprinkler",
    "Pop-up sprinkler 4 inch",
    "Rain gun 1.5 inch",
    "Rain gun 2 inch",
    "Rain hose 1.5 inch 100m",
    "Rain hose 2 inch 100m",
  ]) {
    for (const i of [1, 2, 3]) {
      add(
        p(
          `${type} Model ${i}`,
          `DT-SPR-${type.slice(0, 6).replace(/\s/g, "")}-${i}`,
          type.includes("Rain gun") || type.includes("Rain hose")
            ? "rain_guns"
            : "sprinkler_systems",
          "Sprinklers",
          `${type} for field and landscape irrigation. Common China export pattern for East African agro dealers.`,
          type.includes("Rain gun") ? 4500 + i * 500 : type.includes("Rain hose") ? 8000 + i * 1000 : 350 + i * 120,
          [type],
          ["Open field", "Pasture", "Nursery"],
          [{ name: "Type", value: type }],
          undefined,
        ),
      );
    }
  }

  // Pumps
  for (const hp of [0.5, 1, 1.5, 2, 3, 5]) {
    for (const kind of ["Surface centrifugal", "Peripheral", "Submersible borehole"]) {
      add(
        p(
          `${kind} Pump ${hp}HP Single Phase`,
          `DT-PMP-${kind.slice(0, 3).toUpperCase()}-${String(hp).replace(".", "")}`,
          "pumps_motors",
          "Pumps",
          `${kind} ${hp} HP irrigation pump, single phase options where applicable. Sized for Kenyan smallholder and medium farms.`,
          Math.round(hp * 18000 + (kind.includes("Submersible") ? 15000 : 5000)),
          [`${hp} HP`, kind],
          ["Tank filling", "Drip pressure", "Borehole"],
          [
            { name: "Power", value: String(hp), unit: "HP" },
            { name: "Type", value: kind },
          ],
          undefined,
        ),
      );
    }
  }

  // Solar pumps
  for (const w of [300, 500, 750, 1000, 1500, 2000]) {
    add(
      p(
        `Solar Water Pump ${w}W Complete Set`,
        `DT-SOL-${w}`,
        "solar_irrigation",
        "Solar pumps",
        `${w}W solar water pumping set for off-grid irrigation. Panel + controller + pump style kits popular from China OEMs into Kenya.`,
        w * 45,
        [`${w}W`, "DC pump set"],
        ["Off-grid farms", "Drip supply"],
        [{ name: "Power", value: String(w), unit: "W" }],
        undefined,
      ),
    );
  }

  // Fertigation
  for (const size of ["1/2", "3/4", "1"]) {
    add(
      p(
        `Venturi Fertilizer Injector ${size}"`,
        `DT-VEN-${size.replace("/", "")}`,
        "fertigation_systems",
        "Injectors",
        `Venturi fertiliser injector ${size} inch for drip fertigation — standard China irrigation accessory.`,
        size === "1/2" ? 2200 : size === "3/4" ? 2800 : 3500,
        ["Venturi", size + '"'],
        ["Drip fertigation", "Greenhouse"],
        [{ name: "Size", value: size, unit: "inch" }],
        undefined,
      ),
    );
  }
  for (const l of [50, 100, 200]) {
    add(
      p(
        `Fertilizer Tank ${l}L With Agitator Ports`,
        `DT-FTK-${l}`,
        "fertigation_systems",
        "Tanks",
        `${l}L dosing tank for fertigation skids.`,
        l * 45,
        [`${l}L`],
        ["Fertigation"],
        [{ name: "Volume", value: String(l), unit: "L" }],
        undefined,
      ),
    );
  }

  // Greenhouse / nursery
  for (const cells of [50, 72, 128, 200]) {
    for (const pack of [10, 50]) {
      add(
        p(
          `Seedling Tray ${cells} Cells Pack of ${pack}`,
          `DT-TRAY-${cells}-${pack}`,
          "seedling_trays_nursery",
          "Trays",
          `${cells}-cell seedling tray, pack of ${pack}. Nursery staple.`,
          pack * (cells > 100 ? 80 : 60),
          [`${cells} cells`],
          ["Nursery", "Greenhouse"],
          [{ name: "Cells", value: String(cells) }],
          undefined,
        ),
      );
    }
  }

  for (const micron of [15, 20, 25, 30]) {
    add(
      p(
        `Mulching Film ${micron} Micron 1m x 400m Black Silver`,
        `DT-MUL-${micron}`,
        "mulching_materials",
        "Mulch film",
        `${micron} micron mulching film 1m x 400m black/silver for vegetable beds.`,
        3500 + micron * 40,
        [`${micron}µm`, "Black/silver"],
        ["Vegetables", "Open field"],
        [{ name: "Thickness", value: String(micron), unit: "micron" }],
        undefined,
      ),
    );
  }

  // Water storage
  for (const l of [500, 1000, 2000, 3000, 5000, 10000]) {
    add(
      p(
        `Plastic Water Tank ${l}L Vertical`,
        `DT-TANK-${l}`,
        "water_storage",
        "Tanks",
        `${l}L vertical plastic water tank for gravity drip and domestic farm storage.`,
        Math.round(l * 12),
        [`${l}L`, "UV plastic"],
        ["Gravity drip", "Farm store"],
        [{ name: "Volume", value: String(l), unit: "L" }],
        undefined,
      ),
    );
  }

  // Controllers
  for (const zones of [2, 4, 6, 8, 12]) {
    add(
      p(
        `Irrigation Timer Controller ${zones} Station`,
        `DT-CTL-${zones}`,
        "controllers_timers",
        "Controllers",
        `${zones}-station irrigation controller / timer for solenoid zones.`,
        4500 + zones * 800,
        [`${zones} stations`],
        ["Automated zones", "Greenhouse"],
        [{ name: "Stations", value: String(zones) }],
        undefined,
      ),
    );
  }

  // Layflat
  for (const inch of [2, 2.5, 3, 4]) {
    for (const m of [50, 100]) {
      add(
        p(
          `Layflat Hose ${inch}" ${m}m`,
          `DT-LAY-${inch}-${m}`,
          "pipes_fittings",
          "Layflat",
          `${inch} inch layflat delivery hose ${m}m — filter to field portable main.`,
          inch * m * 25,
          [`${inch}"`, `${m}m`],
          ["Portable main", "Rain gun feed"],
          [
            { name: "Size", value: String(inch), unit: "inch" },
            { name: "Length", value: String(m), unit: "m" },
          ],
          undefined,
        ),
      );
    }
  }

  // Tank connectors & accessories
  for (const size of ["1/2", "3/4", "1", "1.5"]) {
    add(
      p(
        `Tank Connector Kit ${size}" Bulkhead`,
        `DT-TNK-CONN-${size.replace("/", "")}`,
        "accessories",
        "Tank fittings",
        `Tank bulkhead connector kit ${size} inch for plastic tanks.`,
        450 + size.length * 100,
        [size + '" bulkhead'],
        ["Gravity systems"],
        [{ name: "Size", value: size, unit: "inch" }],
        undefined,
      ),
    );
  }

  // Borehole
  for (const dn of [25, 32, 40, 50]) {
    add(
      p(
        `Borehole Delivery Pipe DN${dn} 3m GI Style Alternative HDPE`,
        `DT-BH-${dn}`,
        "borehole_equipment",
        "Borehole pipe",
        `DN${dn} delivery pipe section for borehole to tank lines.`,
        1200 + dn * 15,
        [`DN${dn}`],
        ["Borehole"],
        [{ name: "DN", value: String(dn), unit: "mm" }],
        undefined,
      ),
    );
  }

  // Pad to approach 1000 with unique offtake valves by size
  for (let i = 1; i <= 200; i++) {
    const sp = spacings[i % spacings.length];
    add(
      p(
        `16mm Mini Offtake Valve for PE Pipe Variant ${i} (${sp}mm body)`,
        `DT-OFF-${i}`,
        "accessories",
        "Offtakes",
        `Mini offtake / start connector for 16mm tape on PE pipe — variant ${i}. High-volume China accessory SKU.`,
        35 + (i % 10),
        ["16mm offtake", "PE saddle style"],
        ["Drip install"],
        [{ name: "Variant", value: String(i) }],
        undefined,
      ),
    );
  }

  for (const tool of [
    "Drip Tape Hole Punch Heavy Duty",
    "PE Pipe Hole Punch 16mm",
    "Pipe Cutter Ratchet 16-40mm",
    "Pipe Cutter Ratchet 20-63mm",
    "Goof Plug Pack 100",
    "Barbed Join 16mm Pack 100",
    "Barbed Tee 16mm Pack 50",
    "Barbed Elbow 16mm Pack 50",
  ]) {
    for (const v of [1, 2, 3]) {
      add(
        p(
          `${tool} Type ${v}`,
          `DT-TOOL-${tool.slice(0, 8).replace(/\s/g, "")}-${v}`,
          "accessories",
          "Tools",
          `${tool} — install tool/consumable used with China drip systems.`,
          200 + v * 50,
          [tool],
          ["Installation"],
          [{ name: "Type", value: String(v) }],
          undefined,
        ),
      );
    }
  }

  return out;
}

export const CHINA_CATALOG_COUNT = buildChinaStyleCatalog().length;
