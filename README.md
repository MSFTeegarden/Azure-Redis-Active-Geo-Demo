# Azure Cache for Redis Active Geo-Replication Demo
This demo uses a simple inventory scenario to show how active geo-distribution works in the Enterprise tiers of [Azure Cache for Redis](https://azure.microsoft.com/services/cache/). 

## Overview
This demo shows a sample inventory page which shows three different T-shirt options. The user can "purchase" each T-shirt and see the inventory drop. The unique thing about this demo is that we run the inventory app in two different regions. Typically, you would have to run the database storing inventory data in a single region so that there are no consistency issues. That can result in unpleasant latency performance.  By using Azure Cache for Redis as the backend, however, we can link two caches together with [active geo-distribution](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/) so that the inventory remains consistent across both regions while enjoying local low latency performance from Redis. 

## Architecture
![demo architecture](/docs/architecture.jpg)

The app is built out of two services:
- [Azure Kubernetes Service](https://azure.microsoft.com/services/kubernetes-service/) (AKS) runs the frontend, using Node.JS and Express. 
- [Azure Cache for Redis](https://azure.microsoft.com/services/cache/) stores inventory data, using the Enterprise tier, which features active geo-replication

The AKS instances and Redis instances are paired together in each region--West US 2 (Washington) and East US (Virginia) to maximize performance. To ensure consistency between the Redis instances, they are linked together with active geo-replicaiton across regions. 

## Instructions
### 1. Create the Azure Cache for Redis instances
First, create a new Azure Cache for Redis instance in the West US 2 region [^1]. Select the Enterprise E10 SKU, and agree to the marketplace terms [^2]. 

![create Enterprise Redis cache](/docs/createnewcache.jpg)

[^1]: You can use other regions than West and East US for this demo, but the Enterprise tier is not yet available in all regions, so check first
[^2]: If you're using a Visual Studio Subscription or Azure Credits, you will still need to have a credit card on file to be billed for the marketplace component of the Enterprise tier price.

Select "Public Endpoint" for networking--this is **not** recommended for production use, but is selected for ease of deployment for this demo.

![choose cache networking](/docs/choosenetwork.jpg)

Enable "Non-TLS access only" and click "configure" in the active geo-replication section.

![configurecache](/docs/configurecache.jpg)

Create a new active geo-replication group, select the box, and click "configure". You'll use this group name when linking the second cache. Select "Review + create" and then "Create." You'll need to wait for this cache to finish provisioning before provisioning the next cache instance so that they can be linked.

![create active geo-replication group](/docs/creategeogroup.jpg)

Provision a second Redis instance in the East US region, using the same settings. This time, in the "Advanced" tab, select "configure" next to active geo-replication and you should see the group you created earlier. Select this group and click "configure" to confirm. Finish creating and provisioning the second cache.

![link to active geo-replication group](/docs/addtogeogroup.jpg)

### 2. Create the AKS instances
Create two AKS instances--one in the West US 2 region and one in the East US 2 region. The default settings should be fine:
- Standard DS2 v2 node size
- Autoscale
- Public endpoint

![create AKS instance](/docs/createAKS.jpg)

At this point, you should have two AKS instances and two Azure Cache for Redis instances:

![provisioned instances](/docs/finishedservices.jpg)

### 3. Prepare the YAML files
YAML files tell AKS how to provision the deployment. We need to provide:
- The location of the container which holds the app
- Information about the cache, such as the connection key
- The text that will display on our inventory page to identify the information.

![YAML file breakdown](/docs/yamlfile.jpg)

1. The container is fortunately already compiled and ready to go. It can be found on dockerhub at [sanarmsft/azurecachedemo:latest](https://hub.docker.com/r/sanarmsft/azurecachedemo). If you'd like to build your own container, instructions are listed further below.
2. The address of the Redis instance is passed through the enviornmental variable "REDIS_HOST". Update this with the address of your Redis instance in the appropriate region
3. The connection key for the Redis instance is passed through the environmental variable "REDIS_PASSWORD". You can find your key in the Azure portal by going to your cache instance and selecting "Access Keys" in the side bar. Use the primary key.
4. You can change the text under "APP_LOCATION" to be whatever you'd like. 

Two YAML files are included in the repo: [App_East](/YAML/app_east.yaml) and [App_West](/YAML/app_west.yaml). Update these files with your Redis information and (optionally) with a location of a different container image. 

### 4. Apply YAML to your AKS instances
The easy way to do this is to use the portal. Open one of your AKS instances, go to "Services and Ingress" on the left-hand bar, and select "Add"->"Add with YAML"

![AKS configuration to use YAML file](/docs/yaml.jpg)

Copy and paste the appropriate YAML file for the region and select "Apply". You should see a service called "shoppingcart-svc" spin up with type "LoadBalancer". After a few moments, you should see an external IP generated next to the entry. Click on this, and the website should come up!

Repeat the process with the other region, using the other YAML file. 

With both screens up, you should see that changing the inventory in one region is virtually instantly reflected in the other region. 

![Demo running](/docs/finished.png)

You did it! Click on the buttons and explore the demo. To reset the count, add "/reset" after the url. e.g. `<IP address>/reset`


## Building Your Own Container (Optional)
If you'd like to modify the code, or would just like to see the whole process through, you'll need to build the container from scratch and upload it to a container registry of your choice. To do this you'll first need to:
- Have docker installed on your local machine
- If developing on Windows, install [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install)

[This tutorial](https://docs.microsoft.com/en-us/azure/aks/tutorial-kubernetes-prepare-app) offers excellent step-by-step instructions on how to generate a container image and test it on your local machine. The same set of instructions should work for this code base with a few changes:
- You'll need to update the enviornment variables in the `docker-compose.yml`included in this repo, similar to what you did with the `app_west` and `app_east` YAML files. To minimize variables, I recommend using the same Redis instances and connection strings you created for the demo.
- If you're testing with a basic, standard, or premium cache, you should use port 6379 and ensure that SSL is disabled when creating the cache. If you're using Enterprise caches, you'll need to use port 10000. 
- When testing on a local machine, be sure to add the port 8080 after localhost in the address bar. i.e. `localhost:8080`

Once the container is created, you can follow the tutorial for instructions on how to push it to an [Azure Container Registry](https://azure.microsoft.com/en-us/services/container-registry/) instance. Some tips:
- After having issues with permissions, I found it significantly easier to use the Azure Cloud Shell wherever possible. 
- You'll need to attach the ACR instance to your AKS instances. Here are [instructions on how to do that](https://docs.microsoft.com/en-us/azure/aks/cluster-container-registry-integration?tabs=azure-cli)
- You'll also need to modify the YAML files we were using earlier once it's time to run. Simply change the image from `sanarmsft/azurecachedemo:latest` to the address of your container image in ACR.




