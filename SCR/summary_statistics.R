### Introduction -----------------------------------------------------------------------
# This script uses exported data from Google Earth Engine
# Data contains area in ha for each ecosystem type for each municipality
# I will export an ordered table and plot a graph

### Preparation -----------------------------------------------------------------------
library(tidyverse)

data <- read_csv('./DATA/EcoType_municipal.csv') %>% select(-`.geo`, -`system:index`)
data
names(data)


### Plotting ------------------------------------------------------------------------
dat <- data %>%
  gather(Code, value, "101":"842") %>%
  mutate(Code = factor(Code))
levels(dat$Code)

newLevels <- c("Skog","Fjell","Arktisk tundra","Våtmark","Våtmark","Semi-naturlig mark","Naturlig åpne områder","Hav","Ferksvann","Other","Other","Other","Other","Other","Other")
levels(dat$Code) <- newLevels

dat <- dat %>%
  group_by(county, Code) %>%
  summarise(value = sum(value))

cols <- c('#00911d', '#bcbcbc',  '#b4ff8e','#38ffe7', '#f2e341',  '#eb56ff', '#2163ff', '#75b3ff', '#ff0000')
dat %>%
  ggplot(aes(x=county, y=value, fill=Code)) +
  geom_bar(stat='identity', position='stack') +
  coord_flip() +
  theme_bw() +
  scale_fill_manual(values=cols)

# Export to desired location for reporting
dat %>%
  group_by(county) %>%
  mutate(total = sum(value)) %>% ungroup() %>%
  group_by(county,Code) %>%
  summarise(percCover = value/total*100)%>%
  ggplot(aes(x=county, y=percCover, fill=Code)) +
  geom_bar(stat='identity', position='stack') +
  coord_flip() +
  theme_bw() +
  scale_fill_manual(values=cols) +
  ylab("Percentage cover (%)") + xlab('')

### Table ------------------------------------------------------------------------
table <- data %>%
  gather(Code, value, "101":"842") %>%
  mutate(Code = factor(Code))
levels(table$Code)

newLevels <- c("Skog","Fjell","Arktisk tundra","Våtmark","Våtmark","Semi-naturlig mark","Naturlig åpne områder","Hav","Ferksvann","Overflatedyrka jord","Jordbruk over skoggrense","Fulldyrka jord","Jordbruk under skoggrense","Bebygd","Bebygd")
levels(table$Code) <- newLevels

outTable <- table %>%
  group_by(county, Code) %>%
  summarise(value = sum(value)) %>%
  spread(Code, value)

# Export to desired location for reporting
write_csv(outTable, './DATA/outCSV.csv')
