// Every external source used by the checks, with the date we verified the endpoint works.
export const CHECKED = "2026-11-07";

export const SRC = {
  saParcels: {
    name: "City of Santa Ana, Assessor Parcels (ArcGIS REST)",
    url: "https://gis.santa-ana.org/server/rest/services/Public/GIS_AssessorParcels/MapServer/0",
  },
  saZoning: {
    name: "City of Santa Ana, Zoning Classifications (ArcGIS REST)",
    url: "https://gis.santa-ana.org/server/rest/services/Public/PBA_ZoningClassifications/FeatureServer/0",
  },
  saHistoricProps: {
    name: "City of Santa Ana, Historic Properties by Category (ArcGIS REST)",
    url: "https://gis.santa-ana.org/server/rest/services/Public/PBA_HistoricResource/FeatureServer/0",
  },
  saHistoricDistricts: {
    name: "City of Santa Ana, Historic Districts (ArcGIS REST)",
    url: "https://gis.santa-ana.org/server/rest/services/Public/PBA_HistoricResource/FeatureServer/1",
  },
  fema: {
    name: "FEMA National Flood Hazard Layer, flood hazard zones (layer 28)",
    url: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
  },
  ocFlood: {
    name: "OC Public Works, Floodplains (county copy of FEMA zones)",
    url: "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Floodplains/MapServer/0",
  },
  ocFire: {
    name: "OC Public Works, Fire Hazard Severity Zones LRA (county copy of CAL FIRE)",
    url: "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Fire_Hazard_Severity_Zones_LRA/MapServer/0",
  },
  calFireLra: {
    name: "CAL FIRE Fire Hazard Severity Zones, Local Responsibility Areas (2011)",
    url: "https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1",
  },
  cgsLandslide: {
    name: "California Geological Survey, Landslide Zones",
    url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0",
  },
  hcdSb9Short: {
    name: "HCD Housing Law Fact Sheet: Duplexes and Lot Splits (SB 9), April 2026",
    url: "https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf",
  },
  hcdSb9Long: {
    name: "HCD SB 9 Fact Sheet (implementation), September 2024",
    url: "https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf",
  },
} as const;
