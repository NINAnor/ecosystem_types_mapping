### Introduction -----------------------------------------------------------------------
# This script uses GDAL to rasterize data from NINA PostGIS database
# Currently rasterizes AR5 data but can be adjusted to do the same for AR50

### Preparation -----------------------------------------------------------------------
library(doParallel)
cl <- makeCluster(5)
registerDoParallel(cl)

# Using CSV determined grid for for loop
grid <- read.csv('./DATA/grid.csv')
names(grid)

outPath <- paste0("/data/scratch/AR5/") # careful to specify your own output path
try(system(paste0("mkdir ", outPath)))
name <- 'Norway_FKB_ar5_ARTYPE'

# Define your credentials for gisdata
password <- 'password'
username <- 'username'

### Implementation ---------------------------------------------------------------------
foreach(x=1:nrow(grid)) %dopar% {
  
  n <- as.integer(round(as.integer(strsplit(strsplit(as.character(grid$WKT[x]), ' ')[[1]][3], ',')[[1]][1]) / 5.0) * 5) # Why not using columns "top", ...?
  s <- as.integer(round(as.integer(strsplit(strsplit(as.character(grid$WKT[x]), ' ')[[1]][5], ',')[[1]][1]) / 5.0) * 5)
  w <- as.integer(round(as.integer(strsplit(strsplit(as.character(grid$WKT[x]), ' ')[[1]][6], ',')[[1]][2]) / 5.0) * 5)
  e <- as.integer(round(as.integer(strsplit(strsplit(as.character(grid$WKT[x]), ' ')[[1]][3], ',')[[1]][2]) / 5.0) * 5)
  outFilePath <- paste0(outPath,name,'_',x,'.tif')
  extent <- paste(w,s,e,n,sep=" ")
  print(outFilePath)
  print(extent)
  print(x)
  
  system(command = paste("gdal_rasterize -a ar5 -sql 'SELECT \"arealressursArealtype\" AS ar5, geom FROM \"Topography\".\"Norway_FKB_AR5_polygons\"' -a_nodata 0 -te",
                         extent,
                         "-tr 5 5 -ot Byte -co \"COMPRESS=LZW\" -co \"PREDICTOR=2\" PG:'host=gisdata-db.nina.no dbname=gisdata user=", username, "password=", password, "'", 
                         outFilePath, sep = " ") )
}

