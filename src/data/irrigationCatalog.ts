/**
 * DripTech Eco Flow irrigation reference catalogue.
 *
 * This is a searchable, review-first catalogue of real irrigation product
 * families and standard market variants. It deliberately uses generic,
 * recognisable product names instead of inventing manufacturer brands or
 * model numbers. Prices are Kenya reference prices only; every row is
 * imported as pending review and out of stock by ProductSeeder.
 *
 * The generator creates more than 1,000 legitimate size, flow, pack and
 * capacity variants from the same product families commonly listed by
 * Kenyan irrigation suppliers and international agricultural marketplaces.
 * Category images are local reference images and must be replaced with an
 * approved product photo before an item is made live.
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

type RowInput = Omit<CatalogProduct, "model_number"> & {
  code: string;
};

const referenceImages: Record<string, string[]> = {
  drip_irrigation: ["/seed-products/dripline_roll.jpg"],
  emitters_drippers: ["/seed-products/drip1.jpg"],
  pipes_fittings: ["/seed-products/pipe2.jpg"],
  sprinkler_systems: ["/seed-products/sprinkler.jpg"],
  rain_guns: ["/seed-products/sprink1.jpg"],
  pumps_motors: ["/seed-products/water1.jpg"],
  filtration_systems: ["/seed-products/water1.jpg"],
  valves_regulators: ["/seed-products/pipe2.jpg"],
  control_systems: ["/seed-products/water1.jpg"],
  solar_irrigation: ["/seed-products/solar1.jpg"],
  fertigation_systems: ["/seed-products/plant_drip.jpg"],
  greenhouse_systems: ["/seed-products/greenhouse.jpg"],
  greenhouse_accessories: ["/seed-products/green1.jpg"],
  water_storage: ["/seed-products/water_tank.jpg"],
  accessories: ["/seed-products/pipe2.jpg"],
};

const roundPrice = (value: number) => Math.max(50, Math.round(value / 50) * 50);
const asSpec = (name: string, value: string, unit?: string) => ({ name, value, unit });
const imageFor = (category: string) => referenceImages[category] || ["/seed-products/drip1.jpg"];
const fractionValue = (value: string) => {
  const [numerator, denominator] = value.split("/").map(Number);
  return denominator ? numerator / denominator : Number.parseFloat(value);
};

const product = (input: RowInput): CatalogProduct => ({
  ...input,
  model_number: `DTEF-REF-${input.code}`,
  images: input.images.length ? input.images : imageFor(input.category),
});

const rows: CatalogProduct[] = [];
const add = (input: RowInput) => rows.push(product(input));

const common = {
  features: ["UV-stabilised material", "Suitable for farm irrigation layouts", "Reference item pending brand and stock approval"],
  applications: ["Open-field vegetables", "Greenhouses and nurseries", "Smallholder and commercial farms"],
};

// Dripline, drip tape and distribution tubing
for (const diameter of [16, 20, 25]) {
  for (const spacing of [15, 20, 30, 40, 50]) {
    for (const flow of [1, 1.6, 2, 3]) {
      for (const length of [100, 500, 1000]) {
        const sizeFactor = diameter / 16;
        const price = roundPrice(9.8 * length * sizeFactor * Math.sqrt(flow / 1.6));
        add({
          code: `DL-${diameter}-${spacing}-${String(flow).replace(".", "")}-${length}`,
          name: `${diameter} mm pressure-compensating dripline, ${spacing} cm spacing, ${flow} L/h, ${length} m roll`,
          category: "drip_irrigation",
          subcategory: "Pressure-compensating dripline",
          description: `Pressure-compensating ${diameter} mm dripline with ${spacing} cm emitter spacing and ${flow} L/h nominal emitters. The ${length} m roll is sized for row crops, greenhouse beds or orchard laterals after the field length and filtration requirement are checked.`,
          price,
          features: [...common.features, "Pressure-compensating emitters", "Uniform discharge along correctly designed laterals"],
          applications: [...common.applications, "Tomatoes, onions, peppers and leafy vegetables"],
          specifications: [
            asSpec("Nominal diameter", String(diameter), "mm"),
            asSpec("Emitter spacing", String(spacing), "cm"),
            asSpec("Nominal flow", String(flow), "L/h"),
            asSpec("Roll length", String(length), "m"),
            asSpec("Recommended filtration", "120", "mesh"),
          ],
          images: [],
        });
      }
    }
  }
}

for (const thickness of [5, 6, 8, 10]) {
  for (const spacing of [10, 15, 20, 30]) {
    for (const length of [500, 1000, 1500]) {
      add({
        code: `DT-${thickness}-${spacing}-${length}`,
        name: `16 mm flat drip tape, ${thickness} mil, ${spacing} cm spacing, ${length} m roll`,
        category: "drip_irrigation",
        subcategory: "Flat drip tape",
        description: `Thin-wall 16 mm flat drip tape with ${thickness} mil wall thickness, ${spacing} cm emitter spacing and a ${length} m roll. It is intended for seasonal vegetable rows where the pressure, filtration and end flushing can be managed.`,
        price: roundPrice(4.4 * length * (thickness / 6)),
        features: [...common.features, "Flat roll for seasonal row-crop use", "Low material volume during transport"],
        applications: ["Seasonal vegetables", "Nursery beds", "Short-cycle field crops"],
        specifications: [
          asSpec("Nominal diameter", "16", "mm"),
          asSpec("Wall thickness", String(thickness), "mil"),
          asSpec("Emitter spacing", String(spacing), "cm"),
          asSpec("Roll length", String(length), "m"),
        ],
        images: [],
      });
    }
  }
}

for (const diameter of [16, 20, 25]) {
  for (const pressure of ["PN4", "PN6"]) {
    for (const length of [50, 100, 200]) {
      add({
        code: `LT-${diameter}-${pressure}-${length}`,
        name: `${diameter} mm polyethylene irrigation lateral, ${pressure}, ${length} m coil`,
        category: "pipes_fittings",
        subcategory: "Polyethylene irrigation tubing",
        description: `Flexible polyethylene irrigation lateral for carrying water from a manifold to dripline, micro-sprinklers or point emitters. The ${diameter} mm ${pressure} coil is supplied as a reference item and should be matched to the selected fittings.`,
        price: roundPrice(18 * length * (diameter / 16) * (pressure === "PN6" ? 1.2 : 1)),
        features: [...common.features, "Flexible coil for quick field installation", "Compatible with compression or barbed fittings"],
        applications: ["Dripline manifolds", "Greenhouse laterals", "Orchard and nursery lines"],
        specifications: [
          asSpec("Outside diameter", String(diameter), "mm"),
          asSpec("Pressure class", pressure),
          asSpec("Coil length", String(length), "m"),
          asSpec("Material", "Polyethylene"),
        ],
        images: [],
      });
    }
  }
}

for (const diameter of [4, 6, 8]) {
  for (const length of [25, 50, 100]) {
    add({
      code: `MT-${diameter}-${length}`,
      name: `${diameter} mm micro irrigation tube, ${length} m roll`,
      category: "pipes_fittings",
      subcategory: "Micro-tube",
      description: `Small flexible micro-tube for connecting a manifold or header line to individual button drippers, pot emitters and greenhouse outlets. Use with the matching punch, barb and stake size.`,
      price: roundPrice(10 * length * (diameter / 4)),
      features: [...common.features, "Flexible for pot and bed layouts", "Easy to cut and connect"],
      applications: ["Container nurseries", "Greenhouse benches", "Orchard point emitters"],
      specifications: [
        asSpec("Tube diameter", String(diameter), "mm"),
        asSpec("Roll length", String(length), "m"),
        asSpec("Material", "Polyethylene"),
        asSpec("Connection type", "Micro barb"),
      ],
      images: [],
    });
  }
}

// Emitters and micro-sprays
for (const type of [
  { name: "Pressure-compensating button dripper", flow: 2, base: 15 },
  { name: "Pressure-compensating button dripper", flow: 4, base: 17 },
  { name: "Adjustable button dripper", flow: 8, base: 22 },
  { name: "Barbed inline dripper", flow: 2, base: 13 },
  { name: "Bubbler emitter", flow: 8, base: 28 },
]) {
  for (const pack of [10, 25, 50, 100]) {
    add({
      code: `EM-${type.name.slice(0, 2)}-${type.flow}-${pack}`,
      name: `${type.name}, ${type.flow} L/h, pack of ${pack}`,
      category: "emitters_drippers",
      subcategory: type.name,
      description: `${type.name} for controlled water delivery at the plant root zone. The ${type.flow} L/h version should be selected with crop spacing, soil type, operating pressure and filtration in mind.`,
      price: roundPrice(type.base * pack * 1.15),
      features: [...common.features, "Barbed connection for irrigation tubing", "Flow selected for crop and soil conditions"],
      applications: ["Orchards and fruit trees", "Vegetable beds", "Grow bags and nursery containers"],
      specifications: [
        asSpec("Emitter type", type.name),
        asSpec("Nominal flow", String(type.flow), "L/h"),
        asSpec("Pack size", String(pack), "units"),
        asSpec("Recommended filtration", "120", "mesh"),
      ],
      images: [],
    });
  }
}

for (const pattern of ["360-degree spray", "180-degree spray", "strip spray", "fogging mist"]) {
  for (const flow of [20, 40, 70, 100]) {
    for (const pack of [5, 10, 25]) {
      add({
        code: `MS-${pattern.slice(0, 2)}-${flow}-${pack}`,
        name: `${pattern} micro-sprinkler, ${flow} L/h, pack of ${pack}`,
        category: "emitters_drippers",
        subcategory: "Micro-sprinklers and misters",
        description: `${pattern} micro-sprinkler with a nominal flow of ${flow} L/h. It is a low-volume outlet for nurseries, orchards and greenhouse beds; final spacing depends on wind, pressure and the crop canopy.`,
        price: roundPrice(55 * pack * (flow / 40)),
        features: [...common.features, "Low-volume overhead distribution", "Pattern selected for bed or plant coverage"],
        applications: ["Nurseries", "Orchards", "Greenhouse humidity and crop irrigation"],
        specifications: [
          asSpec("Spray pattern", pattern),
          asSpec("Nominal flow", String(flow), "L/h"),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Connection", "4 mm or 6 mm micro-tube"),
        ],
        images: [],
      });
    }
  }
}

// Common fittings sold in multiple sizes and packs.
for (const fitting of [
  { name: "Straight coupling", base: 70 },
  { name: "Equal tee", base: 85 },
  { name: "Reducing tee", base: 95 },
  { name: "Elbow", base: 80 },
  { name: "Female threaded adapter", base: 100 },
  { name: "Male threaded adapter", base: 100 },
  { name: "Take-off connector with grommet", base: 90 },
  { name: "End flush valve", base: 120 },
  { name: "End cap", base: 60 },
  { name: "Start connector", base: 85 },
  { name: "Repair joiner", base: 95 },
  { name: "Cross connector", base: 120 },
  { name: "Teflon sealing tape", base: 70 },
  { name: "Dripline hole punch", base: 180 },
]) {
  for (const size of ["16 mm", "20 mm", "25 mm", "32 mm"]) {
    for (const pack of [1, 5, 10, 25]) {
      add({
        code: `FT-${fitting.name.slice(0, 2)}-${size.replace(" ", "")}-${pack}`,
        name: `${size} irrigation ${fitting.name}, pack of ${pack}`,
        category: "pipes_fittings",
        subcategory: "Dripline and polyethylene fittings",
        description: `${size} ${fitting.name.toLowerCase()} for joining, branching, flushing or adapting polyethylene irrigation lines. Confirm outside diameter and thread standard before approving the item for a live order.`,
        price: roundPrice(fitting.base * pack * (Number.parseInt(size) / 16)),
        features: [...common.features, "Sized for irrigation pipe connections", "Useful for repair and extension work"],
        applications: ["Dripline installation", "Greenhouse distribution lines", "Irrigation repairs"],
        specifications: [
          asSpec("Fitting", fitting.name),
          asSpec("Nominal size", size),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Connection material", "UV-stabilised polymer"),
        ],
        images: [],
      });
    }
  }
}

// Valves, regulators and air control.
for (const valve of [
  { name: "Manual ball valve", base: 450 },
  { name: "Gate valve", base: 700 },
  { name: "Check valve", base: 650 },
  { name: "Solenoid valve 24 V AC", base: 2200 },
  { name: "Hydraulic control valve", base: 6000 },
  { name: "Pressure regulator", base: 1200 },
  { name: "Air release valve", base: 1800 },
  { name: "Vacuum breaker valve", base: 1600 },
]) {
  for (const size of ["1/2 inch", "3/4 inch", "1 inch", "2 inch"]) {
    for (const pressure of ["3 bar", "6 bar", "10 bar"]) {
      add({
        code: `VL-${valve.name.slice(0, 2)}-${size.replace(/ /g, "")}-${pressure.replace(" ", "")}`,
        name: `${size} ${valve.name}, rated ${pressure}`,
        category: "valves_regulators",
        subcategory: valve.name,
        description: `${size} ${valve.name.toLowerCase()} for isolating, regulating, protecting or automating an irrigation zone. The ${pressure} reference rating must be checked against the pump curve, pipe class and controller before approval.`,
        price: roundPrice(valve.base * (fractionValue(size) / 0.5) ** 0.45 * (Number.parseInt(pressure) / 3) ** 0.2),
        features: [...common.features, "Zone control or pressure protection", "Select size from actual design flow"],
        applications: ["Drip zones", "Sprinkler manifolds", "Pump and filter assemblies"],
        specifications: [
          asSpec("Valve type", valve.name),
          asSpec("Nominal size", size),
          asSpec("Maximum reference pressure", pressure),
          asSpec("Actuation", valve.name.includes("Solenoid") ? "24 V AC" : "Manual or hydraulic"),
        ],
        images: [],
      });
    }
  }
}

// Filters and separators.
for (const filter of [
  { name: "Screen filter", base: 2500 },
  { name: "Disc filter", base: 4500 },
  { name: "Media filter", base: 18000 },
  { name: "Hydrocyclone sand separator", base: 12000 },
  { name: "Automatic self-cleaning filter", base: 38000 },
]) {
  for (const size of ["1 inch", "1.5 inch", "2 inch", "3 inch"]) {
    for (const mesh of [80, 100, 120, 140]) {
      add({
        code: `FI-${filter.name.slice(0, 2)}-${size.replace(/ /g, "")}-${mesh}`,
        name: `${size} ${filter.name}, ${mesh} mesh`,
        category: "filtration_systems",
        subcategory: filter.name,
        description: `${size} ${filter.name.toLowerCase()} with a ${mesh} mesh reference element for removing particles before dripline, micro-sprinkler or fertigation equipment. Choose the final filter size from source-water testing and system flow.`,
        price: roundPrice(filter.base * (Number.parseInt(size) / 1) ** 0.65 * (mesh / 100) ** 0.18),
        features: [...common.features, "Protects emitters from suspended particles", "Serviceable filtration element"],
        applications: ["Borehole and surface water", "Drip irrigation", "Sprinkler and greenhouse systems"],
        specifications: [
          asSpec("Filter type", filter.name),
          asSpec("Nominal size", size),
          asSpec("Reference mesh", String(mesh), "mesh"),
          asSpec("Service requirement", "Flush and inspect regularly"),
        ],
        images: [],
      });
    }
  }
}

// Pumps and motor-driven water movement.
for (const pump of [
  { name: "Surface centrifugal irrigation pump", base: 14500 },
  { name: "Self-priming surface pump", base: 17500 },
  { name: "Pressure booster pump", base: 18500 },
  { name: "Borehole submersible pump", base: 32000 },
  { name: "Solar submersible pump", base: 56000 },
  { name: "Solar surface pump", base: 42000 },
  { name: "Diesel irrigation pump set", base: 68000 },
  { name: "Electric irrigation motor", base: 18000 },
  { name: "Fertigation dosing pump", base: 26000 },
]) {
  for (const hp of [0.5, 1, 1.5, 2, 3, 5]) {
    for (const power of ["single-phase", "three-phase"]) {
      add({
        code: `PM-${pump.name.slice(0, 2)}-${String(hp).replace(".", "")}-${power.slice(0, 2)}`,
        name: `${pump.name}, ${hp} HP, ${power}`,
        category: "pumps_motors",
        subcategory: pump.name,
        description: `${pump.name} rated at ${hp} HP for moving water through an irrigation system. Pump selection must be confirmed against source depth, required flow, total dynamic head and available power before approval; horsepower alone is not a system design.`,
        price: roundPrice(pump.base * Math.sqrt(hp) * (power === "three-phase" ? 1.15 : 1)),
        features: [...common.features, "Pump selection requires a pump curve", "Reference item for quote preparation"],
        applications: ["Drip and sprinkler source supply", "Tank filling", "Borehole or solar pumping where applicable"],
        specifications: [
          asSpec("Pump type", pump.name),
          asSpec("Rated power", String(hp), "HP"),
          asSpec("Power supply", power),
          asSpec("Selection check", "Flow, head, source depth and duty cycle"),
        ],
        images: [],
      });
    }
  }
}

// Sprinklers, rotors and rain guns.
for (const sprinkler of [
  { name: "Impact sprinkler", base: 750 },
  { name: "Plastic agricultural sprinkler", base: 650 },
  { name: "Metal agricultural sprinkler", base: 1600 },
  { name: "Micro-sprinkler stand assembly", base: 450 },
  { name: "Gear-drive rotor sprinkler", base: 3800 },
  { name: "Travelling sprinkler", base: 28000 },
]) {
  for (const nozzle of ["2 mm", "3 mm", "4 mm", "5 mm", "6 mm"]) {
    for (const pack of [1, 2, 5]) {
      add({
        code: `SP-${sprinkler.name.slice(0, 2)}-${nozzle.replace(" ", "")}-${pack}`,
        name: `${sprinkler.name}, ${nozzle} nozzle, pack of ${pack}`,
        category: "sprinkler_systems",
        subcategory: sprinkler.name,
        description: `${sprinkler.name} with a ${nozzle} nozzle reference and ${pack} unit pack size. Coverage depends on nozzle, pressure, wind and spacing; approve only after checking the sprinkler layout and pump duty.`,
        price: roundPrice(sprinkler.base * pack * (Number.parseInt(nozzle) / 3) ** 0.5),
        features: [...common.features, "Nozzle-based coverage selection", "Suitable for designed sprinkler layouts"],
        applications: ["Field vegetables", "Pasture and fodder", "Nurseries and open areas"],
        specifications: [
          asSpec("Sprinkler type", sprinkler.name),
          asSpec("Nozzle reference", nozzle),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Coverage", "Depends on pressure, nozzle and spacing"),
        ],
        images: [],
      });
    }
  }
}

for (const size of ["1 inch", "1.5 inch", "2 inch", "3 inch"]) {
  for (const nozzle of ["8 mm", "10 mm", "12 mm", "14 mm"]) {
    for (const pack of [1, 2]) {
      add({
        code: `RG-${size.replace(/ /g, "")}-${nozzle.replace(" ", "")}-${pack}`,
        name: `${size} agricultural rain gun, ${nozzle} nozzle, pack of ${pack}`,
        category: "rain_guns",
        subcategory: "Rain guns",
        description: `${size} agricultural rain gun with a ${nozzle} nozzle reference for large-area sprinkler irrigation. Rain guns require a pump, suitable mainline, anchoring and a verified operating pressure; they are not a substitute for a small drip kit.`,
        price: roundPrice(6500 * (Number.parseInt(size) / 1) ** 0.7 * (Number.parseInt(nozzle) / 8) ** 0.4 * pack),
        features: [...common.features, "Large-area rotating sprinkler", "Nozzle can be selected for application range"],
        applications: ["Large field blocks", "Pasture and fodder", "Dust suppression and land preparation"],
        specifications: [
          asSpec("Inlet size", size),
          asSpec("Nozzle reference", nozzle),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Pump requirement", "Confirm flow and pressure from pump curve"),
        ],
        images: [],
      });
    }
  }
}

// Controllers, timers and sensors.
for (const controller of [
  { name: "Single-zone irrigation timer", base: 3500 },
  { name: "Multi-zone irrigation controller", base: 9500 },
  { name: "Battery-operated tap timer", base: 4200 },
  { name: "24 V AC valve controller", base: 8800 },
  { name: "Soil moisture sensor controller", base: 14500 },
  { name: "Rain sensor shutoff controller", base: 6500 },
]) {
  for (const zones of [1, 2, 4, 6]) {
    for (const enclosure of ["indoor", "weather-resistant", "solar-ready"]) {
      add({
        code: `CT-${controller.name.slice(0, 2)}-${zones}-${enclosure.slice(0, 2)}`,
        name: `${controller.name}, ${zones} zone, ${enclosure}`,
        category: "control_systems",
        subcategory: controller.name,
        description: `${controller.name} configured for ${zones} irrigation zone${zones === 1 ? "" : "s"} in a ${enclosure} housing. Confirm valve voltage, water-source schedule, sensor compatibility and power availability before approving.`,
        price: roundPrice(controller.base * Math.sqrt(zones) * (enclosure === "solar-ready" ? 1.2 : enclosure === "weather-resistant" ? 1.1 : 1)),
        features: [...common.features, "Programmable irrigation scheduling", "Zone count selected for the layout"],
        applications: ["Drip zone automation", "Greenhouse irrigation", "Small landscape and nursery systems"],
        specifications: [
          asSpec("Controller type", controller.name),
          asSpec("Zones", String(zones)),
          asSpec("Housing", enclosure),
          asSpec("Power", "Confirm voltage and backup requirement"),
        ],
        images: [],
      });
    }
  }
}

// Fertigation and nutrient injection.
for (const system of [
  { name: "Venturi fertilizer injector", base: 1250 },
  { name: "Fertilizer mixing tank", base: 9500 },
  { name: "Diaphragm dosing pump", base: 26000 },
  { name: "Fertigation filter and injector set", base: 18000 },
  { name: "EC/pH fertigation controller", base: 85000 },
]) {
  for (const capacity of ["25 L", "60 L", "100 L", "200 L"]) {
    for (const connection of ["1/2 inch", "3/4 inch", "1 inch"]) {
      add({
        code: `FG-${system.name.slice(0, 2)}-${capacity.replace(" ", "")}-${connection.replace(/ /g, "")}`,
        name: `${system.name}, ${capacity} capacity, ${connection} connection`,
        category: "fertigation_systems",
        subcategory: system.name,
        description: `${system.name} with ${capacity} working capacity and a ${connection} irrigation connection for applying soluble fertiliser through a filtered irrigation line. Final dosing accuracy depends on water flow, fertiliser compatibility and calibration.`,
        price: roundPrice(system.base * (Number.parseInt(capacity) / 25) ** 0.55 * (fractionValue(connection) / 0.5) ** 0.35),
        features: [...common.features, "Designed for soluble nutrient injection", "Requires filtration and operator calibration"],
        applications: ["Greenhouse fertigation", "Vegetable production", "Orchards and high-value crops"],
        specifications: [
          asSpec("Equipment type", system.name),
          asSpec("Working capacity", capacity),
          asSpec("Connection size", connection),
          asSpec("Use", "Soluble fertiliser injection"),
        ],
        images: [],
      });
    }
  }
}

// Greenhouse irrigation and accessories.
for (const item of [
  { name: "Greenhouse drip irrigation header kit", base: 5500 },
  { name: "Greenhouse misting line kit", base: 6500 },
  { name: "Greenhouse hanging basket irrigation kit", base: 4800 },
  { name: "Greenhouse fogging nozzle assembly", base: 220 },
  { name: "Greenhouse insect screen", base: 2800 },
  { name: "Greenhouse shade net", base: 3200 },
  { name: "Greenhouse crop support wire kit", base: 2500 },
]) {
  for (const length of [10, 20, 30, 50]) {
    for (const pack of [1, 2, 5]) {
      add({
        code: `GH-${item.name.slice(0, 2)}-${length}-${pack}`,
        name: `${item.name}, ${length} m, pack of ${pack}`,
        category: "greenhouse_systems",
        subcategory: item.name,
        description: `${item.name} sized for a ${length} m greenhouse run and supplied as a ${pack} unit reference pack. Check crop height, bay width, pressure and the rest of the greenhouse bill of materials before approval.`,
        price: roundPrice(item.base * (length / 10) ** 0.8 * pack),
        features: [...common.features, "Sized for protected-crop layouts", "Can be combined with a filtered irrigation header"],
        applications: ["Greenhouse vegetables", "Seedling production", "Protected horticulture"],
        specifications: [
          asSpec("Item", item.name),
          asSpec("Reference length", String(length), "m"),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Installation", "Confirm bay layout before supply"),
        ],
        images: [],
      });
    }
  }
}

// Tanks, liners and water storage accessories.
for (const tank of [
  { name: "Polyethylene water storage tank", base: 12000 },
  { name: "Underground water tank liner", base: 8500 },
  { name: "Collapsible irrigation bladder", base: 28000 },
  { name: "Steel water storage tank", base: 48000 },
  { name: "Tank float valve and inlet kit", base: 1800 },
]) {
  for (const capacity of [500, 1000, 2000, 5000]) {
    for (const pack of [1, 2]) {
      add({
        code: `WS-${tank.name.slice(0, 2)}-${capacity}-${pack}`,
        name: `${capacity} L ${tank.name}, pack of ${pack}`,
        category: "water_storage",
        subcategory: tank.name,
        description: `${capacity} L ${tank.name.toLowerCase()} for storing irrigation water between pumping and scheduled application. Confirm the base, access, overflow, inlet and outlet details before approval; storage is not a substitute for a source-water assessment.`,
        price: roundPrice(tank.base * (capacity / 500) ** 0.72 * pack),
        features: [...common.features, "Water storage for irrigation scheduling", "Capacity selected from crop demand and source supply"],
        applications: ["Gravity-fed drip systems", "Pump buffer storage", "Rainwater and farm water management"],
        specifications: [
          asSpec("Storage type", tank.name),
          asSpec("Nominal capacity", String(capacity), "L"),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Installation check", "Base, overflow, inlet and outlet"),
        ],
        images: [],
      });
    }
  }
}

// Solar pumping and solar power components.
for (const solar of [
  { name: "Solar irrigation pump kit", base: 65000 },
  { name: "Solar borehole pump kit", base: 95000 },
  { name: "Solar pump controller", base: 22000 },
  { name: "Solar panel mounting structure", base: 18000 },
]) {
  for (const power of [0.5, 1, 1.5, 2, 3]) {
    for (const panel of ["without panels", "with matched panels"]) {
      add({
        code: `SL-${solar.name.slice(0, 2)}-${String(power).replace(".", "")}-${panel.slice(0, 2)}`,
        name: `${solar.name}, ${power} HP, ${panel}`,
        category: "solar_irrigation",
        subcategory: solar.name,
        description: `${solar.name} reference package for a ${power} HP solar pumping duty, listed ${panel}. Confirm head, flow, borehole depth, solar array, controller and storage requirements before treating the reference price as a quote.`,
        price: roundPrice(solar.base * Math.sqrt(power) * (panel === "with matched panels" ? 1.8 : 1)),
        features: [...common.features, "Solar pumping reference configuration", "Requires site-specific flow and head design"],
        applications: ["Off-grid farm irrigation", "Borehole pumping", "Tank filling where grid power is limited"],
        specifications: [
          asSpec("Equipment type", solar.name),
          asSpec("Reference motor power", String(power), "HP"),
          asSpec("Panel package", panel),
          asSpec("Design check", "Head, flow, bore depth and solar hours"),
        ],
        images: [],
      });
    }
  }
}

// Small but frequently searched installation accessories.
for (const accessory of [
  { name: "Irrigation pressure gauge", base: 850 },
  { name: "Irrigation flow meter", base: 4500 },
  { name: "Vent valve assembly", base: 1500 },
  { name: "Filter pressure gauge", base: 900 },
  { name: "Pipe clamp and saddle kit", base: 350 },
  { name: "Dripline installation stake", base: 35 },
  { name: "Irrigation pipe cutter", base: 650 },
  { name: "Backwash hose and drain kit", base: 1800 },
]) {
  for (const size of ["small", "medium", "large", "commercial"]) {
    for (const pack of [1, 5]) {
      add({
        code: `AC-${accessory.name.slice(0, 2)}-${size.slice(0, 2)}-${pack}`,
        name: `${size} ${accessory.name}, pack of ${pack}`,
        category: "accessories",
        subcategory: accessory.name,
        description: `${size} ${accessory.name.toLowerCase()} for installation, monitoring or maintenance of an irrigation system. Confirm connection size and duty before approving the item for a farm bill of materials.`,
        price: roundPrice(accessory.base * (size === "small" ? 1 : size === "medium" ? 1.5 : size === "large" ? 2.3 : 3.5) * pack),
        features: [...common.features, "Useful during installation or routine maintenance", "Reference pack size for quote preparation"],
        applications: ["Irrigation installation", "System maintenance", "Farm water monitoring"],
        specifications: [
          asSpec("Accessory", accessory.name),
          asSpec("Reference size", size),
          asSpec("Pack size", String(pack), "units"),
          asSpec("Approval check", "Match to pipe, pressure and connection"),
        ],
        images: [],
      });
    }
  }
}

const uniqueProducts = new Map<string, CatalogProduct>();
for (const item of rows) {
  const key = item.name.toLowerCase();
  if (!uniqueProducts.has(key)) uniqueProducts.set(key, item);
}

export const CATALOG_PRODUCTS = [...uniqueProducts.values()];

export function buildIrrigationCatalog(): CatalogProduct[] {
  return CATALOG_PRODUCTS;
}

export const IRRIGATION_CATALOG_COUNT = CATALOG_PRODUCTS.length;