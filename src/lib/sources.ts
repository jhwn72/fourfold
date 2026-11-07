// Every external source used by the checks, with the date we verified the endpoint works.
export const CHECKED = "2026-11-07";

export const SRC = {
  censusGeocoder: {
    name: "U.S. Census Bureau Geocoder (Public_AR_Current, Current_Current)",
    url: "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
  },
  ocParcels: {
    name: "OC Public Works / OC Survey, Parcels (countywide, ArcGIS REST)",
    url: "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Parcels/FeatureServer/0",
  },
  scagZoning: {
    name: "SCAG Regional Zoning 2024, Zoning_poly_OR (preliminary, Oct 2025; ArcGIS REST)",
    url: "https://maps.scag.ca.gov/scaggis/rest/services/LDX/Zoning_poly_OR/MapServer/0",
  },
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
  anParcels: {
    name: "City of Anaheim, PropertyInfo Parcels (ArcGIS REST)",
    url: "https://gis.anaheim.net/map/rest/services/PropertyInfo/MapServer/0",
  },
  anZoning: {
    name: "City of Anaheim, PropertyInfo Zoning (ArcGIS REST)",
    url: "https://gis.anaheim.net/map/rest/services/PropertyInfo/MapServer/2",
  },
  fuParcels: {
    name: "Fullerton Parcels and HIOZ Sites, Citywide Parcels (ArcGIS Online, published under a Fullerton GIS account, not confirmed official)",
    url: "https://services6.arcgis.com/yMM0eCpNU0fzBaIm/arcgis/rest/services/Fullerton_Parcels_and_HIOZ_Sites/FeatureServer/0",
  },
  fuZoning: {
    name: "Fullerton Parcels and HIOZ Sites, Zoning (ArcGIS Online, published under a Fullerton GIS account, not confirmed official)",
    url: "https://services6.arcgis.com/yMM0eCpNU0fzBaIm/arcgis/rest/services/Fullerton_Parcels_and_HIOZ_Sites/FeatureServer/2",
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
  ocFootprints: {
    name: "OC Public Works, Building Footprints",
    url: "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Building_Footprints/MapServer/0",
  },
  hqta: {
    name: "Caltrans, California High Quality Transit Areas",
    url: "https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHrailroad/CA_HQ_Transit_Areas/FeatureServer/0",
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
