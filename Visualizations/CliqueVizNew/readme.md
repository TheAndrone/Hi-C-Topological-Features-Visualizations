# CliqueVizNew
This is the visualizator of Cliques (Triangles)
Currently 3 datasets with pre-processed files are available:
-BloodCellPCHiC: Javierre et al. Lineage-Specific Genome Architecture Links Enhancers and Non-coding Disease Variants to Target Gene Promoters, Cell, ISSN: 0092-8674, Vol: 167, Issue: 5, Page: 1369-1384.e19 (2016)\
-Jung: Jung, I. et al. A compendium of promoter-centered long-range chromatin interactons in the human genome. Nat Genet 51, 1442–1449 (2019)\
-3DIV: Kyukwang Kim et al. 3DIV update for 2021: a comprehensive resource of 3D genome and 3D cancer genome, Nucleic Acids Research, Volume 49, Issue D1 (2021)\

## How to open
To launch the visualization, copy the whole folder locally and open any html file in the htmlAndJs directory. Press the "Start" button and the visualization will pop up in 5 to 10 seconds. 
We suggest to use Google Chrome browser (112.0.5615.49 or newer) 
In order to include data files in the repository, large datasets were grouped by chromosomes, thus there are several html files for some datasets. Every html file uses data from /data directory, so you must have them copied locally as well.
## What is seen in the visualization
![image](https://user-images.githubusercontent.com/119489036/230384512-f07a0bca-1b3c-4433-aaa3-8c85084062b3.png)

Each triangle (CL3) is in form (A,B,C) where A,B and C are loci on the chromsome, A<B<C and there exist interactions AB, BC and AC.
We say that a triangle ABC has tissue t1 if all 3 links have the tissue t1.

1 - number of CL3 (triangles) selected\
2 - Chromosome selection; rem Giant? rem Garbage - see 8;\
3 - Tissue types selection. All these tissue types must be present in all visible CL3. That means every visible triangle has each of the selected tissue types in each of the 3 links;\
4 and 5 - number of tissues per triangle;\
6 - see 8;\
7 - max link length in bP in each triangle; Distance from C to A in triangle ABC;\
8 - Scatter plot, where each dot is a CL3. X axis - link AB length; Y axis - link BC length. DBSCAN clustering was performed to group similar-sized triangles, each color corresponds to a different cluster. Specific clusters can be selected in plot 6. CL3 without a cluster are called Garbage and can be hidden in section 2. Giant cluster, i.e. triangles in the bottom left corner (small triangles) can be hiden in section 2;\
9 - position of A (i.e. leftmost loci of each triangle) on the chromsome;\
10 and 11 - positions of B and C node of each triangle on the chromsome;\

12 - table with 20 selected CL3 and data on them;\
13 - button to download csv file with currently selected CL3;\
14 - number of CL3 per tissue type currently selected.
