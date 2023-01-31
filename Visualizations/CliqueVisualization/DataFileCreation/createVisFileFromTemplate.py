# This module creates the visualization file, using parameters from the template
# Template is called template.json and is located in the same directory

# template = {
#     "universalFile": "C:/Users/asizo/Documents/myPrograms/dataFiles/data-pvalue-5-fin.json",
#     "minLinkTissueCount": 2,  #for links
#     "tissues": ["Mac0", "Mac1"],   #for links
#     "minC3TissueCount": 1, #for triangles
#     "minC3Tissues": ["Mac0"], #for triangles
#     "DBScan": [20, 30000], #for clustering - [min_samples, eps]
#     "resultName": "demoResults/defaultFileForVisualization.json",
# }

if __name__ == "__main__":

    from universal import UniversalDS, ChrData
    from topologicalFeatures import Cliques
    from vizFileMaker import VisData

    import json
    f = open("template.json")
    template = json.load(f) #list of links and segments
    f.close()

    fn = template["universalFile"]
    U = UniversalDS(fn)
    chData = ChrData(U, ch=U.chrs[0], minLinkTissueCount=template["minLinkTissueCount"], tissueMask=template["tissues"])

    C = Cliques(chData, minC3TissueCount=template["minC3TissueCount"], tissueMask=template["minC3Tissues"]) 

    bb = VisData(C, min_samples=template["DBScan"][0], eps=template["DBScan"][1], DSName=template["resultName"])
