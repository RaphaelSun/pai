# OpenPAI VS Code Client

OpenPAI VS Code Client 是一个 Visual Studio Code 的扩展组件，可以连接 OpenPAI 集群，提交 Job，在本地模拟运行 Job，管理文件等等。

- [OpenPAI VS Code Client](#openpai-vs-code-client)
  - [连接到 OpenPAI 集群](#连接到-openpai-群集)
  - [提交 Job](#提交-job)
  - [本机模拟](#本机模拟)
    - [先决条件](#先决条件)
    - [步骤](#步骤)
    - [局限性](#局限性)
  - [参考](#参考)
    - [GUI](#gui)
    - [Command Palette](#command-palette)
    - [PAI Cluster Explorer](#pai-cluster-explorer)
    - [Settings](#settings)
  - [问题和建议](#问题和建议)
  - [贡献](#贡献)
  - [许可证](#许可证)

## 连接到 OpenPAI 群集

使用 OpenPAI VS Code Client 之前，按照以下步骤连接到 OpenPAI 集群。

注意， OpenPAI 集群的版本必须大于或等于 0.8.0。

1. 使用快捷键 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> 打开命令面板。
2. 如下输入并查找 *PAI: Add PAI Cluster*。

      ![添加集群](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)


3. 按下 <kbd>Enter</kbd>，并输入 OpenPAI 集群的地址。 可以是域名或者 IP 地址。 然后，再次按下 <kbd>Enter</kbd>。

      ![添加集群](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)


4. 配置文件将会被打开，至少需要填入 username 和 password 字段。 完成后，点击右下角的 *Finish* 按钮。 注意，如果直接保存并关闭文件，则无法生效。

      ![添加集群配置](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add-cluster-finish.png)


如果有多个 OpenPAI 群集，可以多次按照上述步骤进行。

## 提交 Job

添加完集群配置后，可以在*PAI CLUSTER EXPLORER* 面板找到该集群。

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/pai_cluster_explorer.png)

提交 V1 Job:

可通过以下步骤创建 Job 配置，并提交到 OpenPAI。

1. Make sure the value of ```protocol_version``` property in cluster configuration is ```'1'```. Double click ```Create Job Config...``` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed. If you are not familiar with this configuration file, learn from [here](https://github.com/Microsoft/pai/blob/master/docs/user/training.md#learn-hello-world-job).
3. Right click on the created job configuration file, then click on ```Submit Job to PAI Cluster```. The client will upload files to OpenPAI and create a job. Once it's done, there is a notification at right bottom corner, you can click to open the job detail page.

      If there are multiple OpenPAI clusters, you need to choose one.

      This animation shows above steps.
      ![submit job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job.gif)

提交 V2 job:

可通过以下步骤创建 Job V2 配置，并提交到 OpenPAI。

1. Make sure the value of ```protocol_version``` property in cluster configuration is ```'2'```. Double click ```Create Job Config...``` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed. If you are not familiar with this configuration file, learn from [here](https://github.com/microsoft/pai/blob/master/docs/marketplace-and-submit-job-v2/marketplace-and-submit-job-v2.md#introduction-to-yaml-file).
3. Right click on the created job v2 configuration file, then click on ```Submit Job to PAI Cluster```. The client will upload files to OpenPAI and create a job. Once it's done, there is a notification at right bottom corner, you can click to open the job detail page.

    If there are multiple OpenPAI clusters, you need to choose one.

    This animation shows above steps.
    ![submit job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job-v2.gif)

## 本机模拟

As it needs sometime to wait job starting in OpenPAI cluster, local simulation can help identifying and debugging most code, environment and configuration issues quickly.

### 先决条件

[Docker](https://docs.docker.com/install/) MUST be installed to use local simulation.

### 步骤

1. As submit a job, you can right click a configuration file to find local simulation.
2. Click *Simulate PAI Job Running*, after a while below notification shows.

    ![simulate running](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate_running.png)

3. you can click on *Simulate first task in VS Code terminal* to simulate directly, or *Reveal in Explorer* to view created docker files and start simulation manually.

This animation shows above steps.
![simulate job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate-job.gif)

### 局限性

As local simulation is a close but still different environment with OpenPAI cluster, there are some issues cannot be found by simulation. Some examples,

- The job may need much more memory or distributed environments. It cannot be simulated locally.
- The job may need GPU, but local computer may not have one. It may need code logic to handle this situation. It also needs a different docker image if you are using TensorFlow. As TensorFlow has different package for GPU and non-GPU runtime.
- The job may run much more time locally. In most case, the computing power of local computer is much lower than servers in the OpenPAI cluster. If you need to simulate a job end-to-end, it may need to reduce iterations to get result faster.
- Local machine may not be able to access some storage. The OpenPAI cluster may be deployed in a private environment, so that local computer may not able to access resource of cluster.

## 参考

### GUI

The client has two GUI parts. First is the *PAI CLUSTER EXPLORER* in explorer and used in above introduction. Second can be opened by the icon in activity bar.

![activity bar](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/activity_bar.png)

There are two parts in the side bar.

- HDFS Explorer

      You can view, upload and download folder and files of the OpenPAI cluster storage.


- Job List

      You can view jobs in OpenPAI cluster. The lists refresh periodically, and the icon shows the status of each job. You can open a job in browser with double clicking it.


![job list](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/job-list.png)

### Command Palette

| Name                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| PAI: Add PAI Cluster            | Add a new OpenPAI cluster                 |
| PAI: Open Website               | View OpenPAI cluster in browser           |
| PAI: Submit Job to PAI Cluster  | Submit an OpenPAI job                     |
| PAI: Create PAI Job Config File | Create an OpenPAI configuration file      |
| PAI: Simulate PAI Job Running   | Generate Docker file for local simulation |

### PAI Cluster Explorer

| Name                    | Description                                   |
| ----------------------- | --------------------------------------------- |
| Open Web Portal...      | Browse to OpenPAI's web portal                |
| List Jobs...            | Open PAI's job list page in VS Code           |
| Create Job Config...    | Create an OpenPAI configuration file          |
| Submit Job...           | Submit an OpenPAI job                         |
| Simulate Job Running... | Generate Docker file for local simulation     |
| Edit Configuration...   | Edit OpenPAI cluster configuration            |
| Open HDFS...            | Open HDFS storage explorer of OpenPAI cluster |

### Settings

| 标识                               | 说明                                                      |
| -------------------------------- | ------------------------------------------------------- |
| pai.job.upload.enabled           | Whether will upload files to codeDir of configuration   |
| pai.job.upload.exclude           | Excluded files and folders for uploading                |
| pai.job.upload.include           | Included files and folders for uploading                |
| pai.job.generateJobName.enabled  | Whether add a random suffix to job name when submitting |
| pai.job.jobList.recentJobsLength | The number in *Recent Submitted Jobs from VS Code*      |
| pai.job.jobList.allJobsPageSize  | The page size of the *All Jobs* list                    |
| pai.job.jobList.refreshInterval  | The refresh interval of job list (in seconds)           |
| pai.hdfs.location                | Where HDFS storage will be shown                        |

## 问题和建议

提交到 [GitHub](https://github.com/Microsoft/pai/issues)

## 贡献

https://github.com/microsoft/pai/blob/master/README_zh_CN.md#参与贡献

## 许可证

MIT