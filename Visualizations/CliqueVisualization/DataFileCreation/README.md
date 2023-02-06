# DataFileCreation
Run the createVisFileFromTemplate.py from this directory to create a file that can be used for the visualization tool. It uses data from template.json to create the file with user's own parameters and dataset.
An example fir the Universal dataset is given in Hi-C-Topological-Features-Visualizations\Visualizations\UniversalDSExample and it has data on pcHiC blood cell interactions.


## template.json structure:
{
"universalFile": "C:/Users/asizo/Documents/myPrograms/dataFiles/data-pvalue-5-fin.json", #absolute path to the Universal dataset file
"minLinkTissueCount": 2,  #int, shows at least how many tissue types should be present in every edge
"tissues": ["Mac0", "Mac1"],   #list of tissue names, list of str. Shows which tissues must be present in every link. Other tissues not in the list can be present as well.
"minC3TissueCount": 1, #int. It tells how many tissues must be present in all 3 links of each clique found.
"minC3Tissues": ["Mac0"], #list of tissue names, list of str. Shows which tissues must be present in each of the cliques (in all 3 links of the clique)
"DBScan": [20, 30000], #list of two ints. Used for DBScan clustering of cliques by their size. [min_samples, eps], see https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html
"resultName": "demoResults/defaultFileForVisualization.json" #path and the name of the result file
}

The template.json is used by the createVisFileFromTemplate.py module which should be executed from this directory.