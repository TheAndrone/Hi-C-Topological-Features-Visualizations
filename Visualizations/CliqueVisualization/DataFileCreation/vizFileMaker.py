# -*- coding: utf-8 -*-
"""
Created on Sat Jan  7 21:01:32 2023

@author: asizo
"""

from universal import *
from topologicalFeatures import *
import json
from pathlib import Path

from sklearn.cluster import DBSCAN
import numpy as np
from numpy import unique, where
from sklearn.datasets import make_classification
import math


def getBitCount(bits): #returns number of 1s in binary form
    count = 0
    while (bits):
        bits &= (bits-1)
        count+= 1
    return count

class VisData:
    def __init__(self, cliquesObject, eps=20000, min_samples=10, DSName="DS-forVisualization.json", MIN_LIM=2e6):
        #this class creates a file that can be used in visualization. Cliques like in cliqueObkject will be calculated for all chrs
        self.cliquesObject = cliquesObject
        self.eps=eps
        self.min_samples = min_samples #for DBSCAN algorithm
        self.DSName=DSName
        self.MIN_LIM = MIN_LIM
        self.mkFile()
    def mkFile(self):
        #result should be a json file with structure
        #{
        #"tisBits": {"aCD4":1, "EP":2, "Ery":4, ...}
        #"tissues": ["aCD4", "EP", "Ery", ..."]
        #chrs: ["chr1", "chr2", ...]
        #chrClusters: {"chr1": [-1,0,1,2,3], "chr2":[], ...} with lists of cluster ids
        #chrValues: {"chr1":[], "chr2":[], ...}, 
            #    where each [] is a list of lists - [[ID, A, B, C, a, b, tisBitmap, tisCount, clusterID], [], []]
        #}
        res = dict.fromkeys(["tisBits", "tissues", "chrs", "chrClusters", "chrValues"]) #this will be saved
        
        U = self.cliquesObject.owner.owner #UniversalDS
        chDataGiven = self.cliquesObject.owner #ChrData
        
        
        minC3TissueCount=self.cliquesObject.minC3TissueCount
        c3TissueMask=self.cliquesObject.tissueMask
        #clique filter parameters
        
        minLinkTissueCount=chDataGiven.minLinkTissueCount
        linkTissueMask=chDataGiven.tissueMask
        #link filter parameters
        
        res["tisBits"] = U.tissueBits
        res["tissues"] = U.tissues
        res["chrs"] = U.chrs
        
        D = {ch: [] for ch in U.chrs}    #store results with file chrValues without clusters  
        for ch in U.chrs:
            chData = ChrData(owner=U, ch=ch, minLinkTissueCount=minLinkTissueCount, tissueMask=linkTissueMask)
            cliquesObj = Cliques(owner=chData, minC3TissueCount=minC3TissueCount, tissueMask=c3TissueMask)
            
            cliques = cliquesObj.getTriangles() #list of (A,B,C,bitmap), A,B,C are indeces
            cliqueLocis = [chData.listOfIndsToListOfLoci(el[:3])+[el[3]] for el in cliques] 
            #cliqueLocis is now list of [A,B,C,bit] for each clique. A,B,C are now loci
            
            ind=0
            L = []
            for [A,B,C,tisBitmap] in cliqueLocis:
                [A,B,C] = sorted([A,B,C])
                newRow = [ind, A, B, C, (B-A), (C-B), tisBitmap, getBitCount(tisBitmap), 0]
                # [ind, A, B, C, a, b, tisBitmap, tisCount, clusterID=-1]
                ind+=1
                L.append(newRow)
            iii=2
            D[ch] = L 
        
        #for each chr, clustering should be performed by a and b
        #only take points beneath 2M
        MIN_LIM = self.MIN_LIM #==2e6
        chrClusters = dict()
        for ch in U.chrs:
            ab = [[el[4], el[5]] for el in D[ch] if el[4]<=MIN_LIM and el[5]<=MIN_LIM]
            for el in D[ch]:
                if el[4]>MIN_LIM or el[5]>MIN_LIM: el[-1] = 7777 #set cluster for those that are outside viewing window
            #this was done to make sure points outside viewing panel are not clustered at all, they are given -1 cluster automatically    
            
            X = np.array(ab)
            model = DBSCAN(eps = self.eps, min_samples=self.min_samples)
            yhat = model.fit_predict(X)
            clusters= unique(yhat)
            chrClusters[ch] = [int(el) for el in list(clusters)]
            i=0
            shouldAdd7777ToClusters = False
            #print(len(yhat), len(D[ch]), len([el for el in D[ch] if el[-1]==7777]) ) # print X, Y, Z and Y = X+Z
            for row in D[ch]:
                if row[-1]==7777: 
                    shouldAdd7777ToClusters = True
                    continue
                row[-1]=int(yhat[i]) #give each [ID, A,B,C,a,b,bit,count, CLUSTER] CLUSTER data
                i+=1
            if shouldAdd7777ToClusters: chrClusters[ch].append(7777)
        res["chrClusters"] = chrClusters
        res["chrValues"] = D
        
        #now saving the result
        #return res
        fn = self.DSName
        if type(fn)!=type("fn.json"): 
            chDataGiven.error("In VisData constructor DSName should be a string", self.DSName)
        if fn[-5:]!=".json": fn=fn+".json"
        Path(fn[:(fn.rfind('/'))]).mkdir(parents=True, exist_ok=True) #create the path if it does not exist
        with open(fn, "w") as f:
            json.dump(res, f)
        
        
# 
 
        