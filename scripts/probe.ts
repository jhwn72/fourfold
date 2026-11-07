// Hit each MVP endpoint once with one real Santa Ana parcel and print the fields we need.
import { arcgisQuery } from "../src/lib/arcgis";

const SA_PARCELS = "https://gis.santa-ana.org/server/rest/services/Public/GIS_AssessorParcels/MapServer/0";
const SA_ZONING = "https://gis.santa-ana.org/server/rest/services/Public/PBA_ZoningClassifications/FeatureServer/0";
const OC_PARCELS = "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Parcels/FeatureServer/0";
const FEMA = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28";
const OC_FLOOD = "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Floodplains/MapServer/0";
const OC_FIRE = "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Fire_Hazard_Severity_Zones_LRA/MapServer/0";
const CGS_SLIDE = "https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0";

async function step(name: string, fn: () => Promise<unknown>) {
  const t = Date.now();
  try {
    const out = await fn();
    console.log(`\n== ${name}: OK (${Date.now() - t} ms)`);
    console.log(JSON.stringify(out, null, 1).slice(0, 1500));
  } catch (e) {
    console.log(`\n== ${name}: FAILED (${Date.now() - t} ms) ${(e as Error).message}`);
  }
}

async function main() {
  // 1. One R1 zoning polygon, then a parcel inside it.
  const zone = await arcgisQuery(SA_ZONING, {
    where: "ZONECLASS='R1'", outFields: "ZONECLASS,ZONEDESC,ZONEOVERLAY", returnGeometry: true,
    outSR: 2230, resultRecordCount: 1,
  });
  const ring = zone.features[0].geometry!.rings![0];
  const [x, y] = ring[0];
  const env = { xmin: x - 300, ymin: y - 300, xmax: x + 300, ymax: y + 300, spatialReference: { wkid: 2230 } };
  const parcels = await arcgisQuery(SA_PARCELS, {
    geometry: JSON.stringify(env), geometryType: "esriGeometryEnvelope", inSR: 2230,
    spatialRel: "esriSpatialRelIntersects", where: "SiteAddress IS NOT NULL",
    outFields: "*", returnGeometry: true, outSR: 2230, resultRecordCount: 5,
  });
  const p = parcels.features[0];
  console.log("== SA parcel sample attributes:", JSON.stringify(p.attributes, null, 1));
  const r = p.geometry!.rings![0];
  const cx = r.reduce((s, q) => s + q[0], 0) / r.length;
  const cy = r.reduce((s, q) => s + q[1], 0) / r.length;
  const poly = JSON.stringify({ rings: p.geometry!.rings, spatialReference: { wkid: 2230 } });
  const pt = JSON.stringify({ x: cx, y: cy, spatialReference: { wkid: 2230 } });
  const polyQ = { geometry: poly, geometryType: "esriGeometryPolygon", inSR: 2230, spatialRel: "esriSpatialRelIntersects", returnGeometry: false };

  await step("SA parcel by address", () =>
    arcgisQuery(SA_PARCELS, { where: `SiteAddress='${String(p.attributes.SiteAddress).replace(/'/g, "''")}'`, outFields: "AssessmentNo,SiteAddress,SiteCityState,SiteZip5", returnGeometry: false }).then(j => j.features.map(f => f.attributes)));
  await step("SA zoning at parcel centroid", () =>
    arcgisQuery(SA_ZONING, { geometry: pt, geometryType: "esriGeometryPoint", inSR: 2230, spatialRel: "esriSpatialRelIntersects", outFields: "ZONECLASS,ZONEDESC,ZONEOVERLAY,ORD_NO,ORD_DATE", returnGeometry: false }).then(j => j.features.map(f => f.attributes)));
  await step("OC parcels at centroid", () =>
    arcgisQuery(OC_PARCELS, { geometry: pt, geometryType: "esriGeometryPoint", inSR: 2230, spatialRel: "esriSpatialRelIntersects", outFields: "*", returnGeometry: false }).then(j => j.features.map(f => f.attributes)));
  await step("FEMA NFHL 28 (parcel polygon)", () =>
    arcgisQuery(FEMA, { ...polyQ, outFields: "FLD_ZONE,SFHA_TF,ZONE_SUBTY" }, { retries: 1 }).then(j => j.features.map(f => f.attributes)));
  await step("OC Floodplains (parcel polygon)", () =>
    arcgisQuery(OC_FLOOD, { ...polyQ, outFields: "*" }).then(j => ({ count: j.features.length, first: j.features[0]?.attributes })));
  await step("OC Floodplains any (fields)", () =>
    arcgisQuery(OC_FLOOD, { where: "1=1", outFields: "*", returnGeometry: false, resultRecordCount: 2 }).then(j => j.features.map(f => f.attributes)));
  await step("OC Fire LRA (parcel polygon)", () =>
    arcgisQuery(OC_FIRE, { ...polyQ, outFields: "*" }).then(j => ({ count: j.features.length, first: j.features[0]?.attributes })));
  await step("OC Fire LRA any (fields)", () =>
    arcgisQuery(OC_FIRE, { where: "1=1", outFields: "*", returnGeometry: false, resultRecordCount: 2 }).then(j => j.features.map(f => f.attributes)));
  await step("CGS landslide (parcel polygon)", () =>
    arcgisQuery(CGS_SLIDE, { ...polyQ, outFields: "*" }).then(j => ({ count: j.features.length, first: j.features[0]?.attributes })));
  await step("CGS landslide any (fields)", () =>
    arcgisQuery(CGS_SLIDE, { where: "1=1", outFields: "*", returnGeometry: false, resultRecordCount: 1 }).then(j => j.features.map(f => f.attributes)));
  console.log("\nparcel ring vertices:", r.length, "centroid(2230):", cx.toFixed(1), cy.toFixed(1));
}
main();
