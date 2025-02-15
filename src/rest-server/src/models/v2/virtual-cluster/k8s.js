// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// module dependencies
const createError = require('@pai/utils/error');
const vcConfig = require('@pai/config/vc');
const k8s = require('@pai/utils/k8sUtils');
const axios = require('axios');
const yaml = require('js-yaml');

const vcData = {
  resourceUnits: vcConfig.resourceUnits,
  virtualCellCapacity: vcConfig.virtualCellCapacity,
  clusterTotalGpu: vcConfig.clusterTotalGpu,
  clusterNodeGpu: vcConfig.clusterNodeGpu,
};


const getResourceUnits = () => {
  return vcData.resourceUnits;
};

const getPodsInfo = async () => {
  const rawPods = (await axios({
    method: 'get',
    url: vcConfig.podsUrl,
  })).data.items;

  // parse pods spec
  const pods = Array.from(rawPods, (pod) => {
    const annotations = pod.metadata.annotations;
    const labels = pod.metadata.labels;

    const podInfo = {
      jobName: labels.jobName,
      userName: labels.userName,
      virtualCluster: labels.virtualCluster,
      taskRoleName: labels.FC_TASKROLE_NAME,
      nodeIp: pod.spec.nodeName,
      resourcesUsed: {
        cpu: 0,
        memory: 0,
        gpu: 0,
      },
    };

    const bindingInfo = annotations['hivedscheduler.microsoft.com/pod-bind-info'];
    const resourceRequest = pod.spec.containers[0].resources.requests;
    podInfo.resourcesUsed.cpu = parseInt(resourceRequest.cpu);
    podInfo.resourcesUsed.memory = k8s.convertMemoryMb(resourceRequest.memory);
    if (resourceRequest.hasOwnProperty('hivedscheduler.microsoft.com/pod-scheduling-enable')) {
      if (bindingInfo != null) {
        // scheduled by hived
        const info = yaml.safeLoad(bindingInfo);
        podInfo.resourcesUsed.gpu = info.gpuIsolation.length;
      }
    } else {
      podInfo.resourcesUsed.gpu = resourceRequest['nvidia.com/gpu'];
    }
    return podInfo;
  });

  return pods;
};

const getNodeResource = async () => {
  const pods = await getPodsInfo();
  const nodeResource = {};

  for (let node of Object.keys(vcData.clusterNodeGpu)) {
    nodeResource[node] = {
      gpuTotal: vcData.clusterNodeGpu[node].gpu,
      gpuUsed: 0,
      gpuAvaiable: vcData.clusterNodeGpu[node].gpu,
    };
  }

  for (let pod of pods) {
    if (!nodeResource.hasOwnProperty(pod.nodeIp)) {
      // pod not in configured nodes
      continue;
    }
    nodeResource[pod.nodeIp].gpuUsed += pod.resourcesUsed.gpu;
    nodeResource[pod.nodeIp].gpuAvaiable -= pod.resourcesUsed.gpu;
  }
  return nodeResource;
};

const getVcList = async () => {
  const pods = await getPodsInfo();

  // get vc usage
  const vcInfos = {};
  const allVc = new Set([...Array.from(pods, (pod) => pod.virtualCluster), ...Object.keys(vcData.virtualCellCapacity)]);
  for (let vc of allVc) {
    vcInfos[vc] = {
      capacity: 0,
      usedCapacity: 0,
      numJobs: 0,
      resourcesUsed: {
        memory: 0,
        cpu: 0,
        gpu: 0,
      },
      resourcesTotal: {
        memory: 0,
        cpu: 0,
        gpu: 0,
      },
    };
  }

  // set used resource
  const countedJob = new Set();
  for (let pod of pods) {
    if (!countedJob.has(pod.userName + '~' + pod.jobName)) {
      countedJob.add(pod.userName + '~' + pod.jobName);
      vcInfos[pod.virtualCluster].numJobs += 1;
    }
    vcInfos[pod.virtualCluster].resourcesUsed.memory += pod.resourcesUsed.memory;
    vcInfos[pod.virtualCluster].resourcesUsed.cpu += pod.resourcesUsed.cpu;
    vcInfos[pod.virtualCluster].resourcesUsed.gpu += pod.resourcesUsed.gpu;
  }

  // set configured resource
  for (let vc of Object.keys(vcData.virtualCellCapacity)) {
    vcInfos[vc].resourcesTotal.memory = vcData.virtualCellCapacity[vc].resourcesTotal.memory;
    vcInfos[vc].resourcesTotal.cpu = vcData.virtualCellCapacity[vc].resourcesTotal.cpu;
    vcInfos[vc].resourcesTotal.gpu = vcData.virtualCellCapacity[vc].resourcesTotal.gpu;
  }

  // add capacity, maxCapacity, usedCapacity for compatibility
  if (vcData.clusterTotalGpu > 0) {
    for (let vc of Object.keys(vcInfos)) {
      vcInfos[vc].capacity = vcInfos[vc].resourcesTotal.gpu / vcData.clusterTotalGpu * 100;
      vcInfos[vc].maxCapacity = vcInfos[vc].capacity;
      vcInfos[vc].usedCapacity = vcInfos[vc].resourcesUsed.gpu / vcData.clusterTotalGpu * 100;
    }
  }

  // add GPUs, vCores for compatibility
  for (let vc of Object.keys(vcInfos)) {
    vcInfos[vc].resourcesUsed.vCores = vcInfos[vc].resourcesUsed.cpu;
    vcInfos[vc].resourcesUsed.GPUs = vcInfos[vc].resourcesUsed.gpu;
    vcInfos[vc].resourcesTotal.vCores = vcInfos[vc].resourcesTotal.cpu;
    vcInfos[vc].resourcesTotal.GPUs = vcInfos[vc].resourcesTotal.gpu;
  }
  return vcInfos;
};

const getVc = async (vcName) => {
  const vcInfos = await getVcList();
  if (!vcInfos.hasOwnProperty(vcName)) {
    throw createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found`);
  }
  return vcInfos[vcName];
};

const updateVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'updateVc not implemented in k8s');
};

const stopVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'stopVc not implemented in k8s');
};

const activeVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'activeVc not implemented in k8s');
};

const removeVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'removeVc not implemented in k8s');
};

// module exports
module.exports = {
  list: getVcList,
  get: getVc,
  getResourceUnits: getResourceUnits,
  getNodeResource: getNodeResource,
  update: updateVc,
  stop: stopVc,
  activate: activeVc,
  remove: removeVc,
};
