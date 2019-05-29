/*
Title: Mapping of major ecosystem types over Norway
Author: Zander Venter
Organisation: Norwegian Institute for Nature Research
Purpose of script: Use existing datasets with mapping rules to classify major ecosystem types
*/

/***
 * Import datasets and geometries
 */

var skoggrense = ee.Image("users/zandersamuel/NINA/Raster/Norway_Naturindeks_N50_vegetasjonssoner_25m"), // forest line raster
    ar50_col = ee.ImageCollection("users/zandersamuel/NINA/Raster/AR50"), // ar50 rasters
    ar5_col = ee.ImageCollection("users/zandersamuel/NINA/Raster/AR5_new"), // ar5 rasters
    vegZones = ee.FeatureCollection("users/zandersamuel/NINA/Vector/Norway_vegetasjonsseksjoner"), // vegetation zones
    arctic = ee.FeatureCollection("users/zandersamuel/NINA/Vector/arctic_tundra"), // arctic shapefile predefined by Jane Jepson
    counties = ee.FeatureCollection("users/zandersamuel/NINA/Vector/Fenoscandia_Municipality_polygon"), // municipal boundaries
    geometry = // Geometry for testing
    ee.Geometry.Polygon(
        [[[6.575306619178605, 58.1404140361664],
          [6.575306619178605, 58.046055255787515],
          [6.85133811331923, 58.046055255787515],
          [6.85133811331923, 58.1404140361664]]], null, false),
    geometry2 = // geometry of full extent
    ee.Geometry.Polygon(
        [[[3.9489245810104876, 71.44208628979365],
          [3.9489245810104876, 57.72915496291711],
          [31.942088643510488, 57.72915496291711],
          [31.942088643510488, 71.44208628979365]]], null, false);

/***
 * Data preparation
 */

// Define input and output projections for exporting data later
var outProj =  skoggrense.projection();
var inProj =  ar5_col.first().projection();

// Filter counties to Norway
counties = counties.filterMetadata('countryCod','equals','NO');

// Rasterize arctic tundra shapefile
arctic = arctic.map(function(ft){return ft.set('value',1)});
arctic = arctic.reduceToImage(['value'], ee.Reducer.mean());

// Rasterize coastal vegetation O3 zones
var coastalVeg = vegZones.filter(ee.Filter.inList('NAVN', ['O3-Sterkt ocean', 'O3t-Vintermild']));
coastalVeg =  coastalVeg.map(function(ft){return ft.buffer(1000).set('value',1)});
coastalVeg = coastalVeg.reduceToImage(['value'], ee.Reducer.mean());

// Merge all rasters into image for ar5 and ar50
var ar5 = ar5_col.mean();
var ar50 = ar50_col.mean();

// Add to map for inspection
Map.addLayer(ar5.randomVisualizer(), {}, 'ar5',0);
Map.addLayer(ar50.randomVisualizer(), {}, 'ar50',0);

// A testing step to interrogate individual ar50 classes
//Map.addLayer(ar50.updateMask(ar50.eq(50)), {palette:['ff0000']}, 'ar50 type 50',0);

// Define AR5 mssing data
var ar5NoData = ar5.neq(99);

// Define areas above forest line
var forestLine = skoggrense.updateMask(skoggrense.neq(1))
forestLine = forestLine.gt(1).unmask(ee.Image(0));


/***
 * Reclassification using mapping rules outlines in README
 */
 
// AR5 reclass
var ar5reclass = ar5
  .where(ar5.eq(30), 101)
  .where(ar5.eq(70), 201) 
  .where(ar5.eq(60), 401)
  .where(ar5.eq(23), 501)
  .where(ar5.eq(50), 601)
  .where(ar5.eq(50).and(coastalVeg), 501)
  .where(ar5.eq(50).and(ar50.eq(60)), 412)
  .where(ar5.eq(50).and(forestLine), 201)
  .where(ar5.eq(82), 701)
  .where(ar5.eq(81), 801)
  .where(ar5.eq(22), 811)
  .where(ar5.eq(21), 831)
  .where(ar5.eq(11).or(ar5.eq(12)), 841)
  .where(ar5.eq(50).and(arctic), 301)

// AR50 reclass
var ar50reclass = ar50
  .where(ar50.eq(30), 102)
  .where(ar50.eq(50).or(ar50.eq(70)), 202)
  .where(ar50.eq(60), 402)
  .where(ar50.eq(81), 802)
  .where(ar50.eq(82), 702)
  .where(ar50.eq(10), 842)
  .where(ar50.eq(20), 832)
  .where(ar50.eq(20).and(forestLine), 822)
  .where(ar50.eq(50).or(ar50.eq(70)).and(arctic), 302)

// Inspect relassifications separately
var ecoViz = {
  min: 100,
  max: 800,
  palette: [
    '#00911d', //skog 1
    '#bcbcbc', //fjell 2
    '#b4ff8e', //tundra 3
    '#38ffe7', // vatmark 4
    '#f2e341', // semi-natural 5
    '#eb56ff', // apent 6
    '#2163ff', // hav 7
    '#ff0000'// other 8
    ]
}
ar5reclass = ar5reclass.updateMask(ar5NoData)
Map.addLayer(ar5reclass, ecoViz, 'ar5 reclass',0)
Map.addLayer(ar50reclass, ecoViz, 'ar50 reclass',0)


// Combine to create final map of ecosystem types
var ecoTypes = ar5reclass.unmask(ar50reclass);
// there will be thin slithers of 99 or 'Ikke kartelagt' on edge that need to be masked
ecoTypes = ecoTypes.updateMask(ecoTypes.neq(99)) 

// For visualization add water (which is 'Other') as blue
var toMap = ecoTypes.visualize(ecoViz);
var freshWater = ecoTypes.updateMask(ecoTypes.eq(801).or(ecoTypes.eq(802)))
freshWater = freshWater.visualize({palette:['#75b3ff']})
toMap = ee.ImageCollection([toMap,freshWater]).mosaic()

// And add to map
Map.addLayer(toMap, {}, 'ecoTypes map',0)

// Add a legend for display
var utils = require('users/zandersamuel/default:Utils/Tools_misc.js');
var panel = ui.Panel({style: {position: 'bottom-left'}});
var dict = {
  'colors': ['#00911d', '#bcbcbc',  '#b4ff8e','#38ffe7', '#f2e341',  '#eb56ff', '#2163ff', '#75b3ff', '#ff0000'],
  'names': ['Skog','Fjell','Arktisk tunrda','Våtmark','Semi-naturlig','Naturlig Åpent','Hav', 'Ferskvann','Other']
}
utils.addCategoricalLegend(panel, dict, 'Ecosystem Types') 

// Inspect forest line for testing
//Map.addLayer(forestLine, {}, 'forest line',0)
//Map.addLayer(skoggrense.randomVisualizer(), {}, 'forest line',0)


/***
 * Export rasters
 */

// First need to make sure GEE is using a mode reduction when reprojecting and resampling
ecoTypes = ecoTypes.focal_mode()

// Export at 5 m resolution
Export.image.toDrive({ // this needs to be exported to Assets and to Drive
  image: ecoTypes.reproject(inProj),
  description: 'ecoTypes_5m',
  region: geometry2,
  scale:5,
  maxPixels: 1324129936480
})

// Reduce resolution with mode resample and export at 25 m resolution
var reprojEcoTypes = ecoTypes.reproject(inProj);
reprojEcoTypes = reprojEcoTypes
  .reduceResolution(ee.Reducer.mode())
  .reproject(outProj.atScale(15))
  .rename('ecoType');

Export.image.toDrive({
  image: reprojEcoTypes,
  description: 'ecoTypes_25m',
  region: geometry2,
  scale:25,
  maxPixels: 1324129936480
})

// Reduce resolution with mode resample and export at 50 m resolution
reprojEcoTypes = reprojEcoTypes
  .reduceResolution(ee.Reducer.mode())
  .reproject(outProj.atScale(50))
  .rename('ecoType');

Export.image.toDrive({ // this needs to be exported to Assets and to Drive
  image: reprojEcoTypes,
  description: 'ecoTypes_50m',
  region: geometry2,
  scale:50,
  maxPixels: 1324129936480
})


/***
 * Aggregations for summary statistics
 */

// First need to reclassify back into 1,2,3... so that can use .eq() function
ecoTypes = ecoTypes.focal_mode()
var statClass = ecoTypes
  .where(ecoTypes.eq(101),1).where(ecoTypes.eq(102),1)
  .where(ecoTypes.eq(201),2).where(ecoTypes.eq(202),2)
  .where(ecoTypes.eq(301),3).where(ecoTypes.eq(302),3)
  .where(ecoTypes.eq(401),4).where(ecoTypes.eq(402),4)
  .where(ecoTypes.eq(501),5)
  .where(ecoTypes.eq(601),6).where(ecoTypes.eq(602),6)
  .where(ecoTypes.eq(701),7).where(ecoTypes.eq(702),7)
  .where(ecoTypes.eq(801),8).where(ecoTypes.eq(802),8)
  
  .where(ecoTypes.eq(412),9)
  .where(ecoTypes.eq(811),10)
  .where(ecoTypes.eq(831),11)
  .where(ecoTypes.eq(841),12)
  .where(ecoTypes.eq(842),13)
  .where(ecoTypes.eq(832),14)
  .where(ecoTypes.eq(822),15)

// Now we create an image with multiple bands - one band for each class 
// with value 1 for presence of eco type and 0 for absence
var categories = statClass.eq([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
  .rename(['101','201','301','401','501','601','701','801',
            '412','811','831','841','842','832','822'])

// Now calculate area of pixels and sum per municipality and county
categories = categories.focal_mode()
var area = categories.multiply(ee.Image.pixelArea()).multiply(ee.Image(1e-4))
var stat = area.reduceRegions(counties, ee.Reducer.sum(),20);

// export to drive
Export.table.toDrive({collection:stat, description:'EcoType_municipal', fileFormat:'SHP'})



