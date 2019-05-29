# ecosystem_type_mapping
Mapping of main Norwegian ecosystem types using existing datasets

The GIS work was performed using GDAL, RStudio and Google Earth Engine (GEE). Scripts need to be run in the appropriate environments and will call on data specific to those environments. The worflow was as follows: 

1. Rasterize ‘ARTYPE’ attribute from AR5 and AR50 using GDAL to convert from PostGIS vector to GeoTIFF raster format at 5 m resolution. This was done by calling on the command line from within RStudio. 

2. Upload of rasterized AR5, AR50, along with skoggrense, Circumpolar Arctic Bioclimatic Zones, and national vegetation types to GEE. 

3. Perform reclassification of AR5 and AR50 rasters within GEE. 

4. GEE allows for on-the-fly computing and thus quality checks can be implemented throughout the processing before export. 

5. Export of ecosystem type raster output at 25 m resolution to GeoTIFF. 

6. Vectorize raster at 50 m resolution and export to ESRI Shapefile. 

7. Use GDAL to convert to GPKG format. 

8. Extract summary statistics within GEE and export to CSV for plotting and analysis in RStudio. 
