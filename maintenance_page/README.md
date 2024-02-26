# Maintenance page

This is based on a Docker nginx container serving a static HTML page for all requests. A Kubernetes deployment and service is temporarily applied to the namespace and the ingress is edited to route all traffic to the maintenance page service.

Based on:
* https://user-guide.cloud-platform.service.justice.gov.uk/documentation/other-topics/maintenance-page.html
* https://github.com/ministryofjustice/cloud-platform-maintenance-page


## How to deploy the maintenance page

### Deploying the maintenance page

From **this directory** run the command to apply the configuration for the maintenance service and deployment:

```
# must be in ./maintenance/page

# Example for dev namespace (will need to replace with 'prod')
kubectl apply -f kubectl_deploy/ -n visit-someone-in-prison-frontend-svc-dev
```

### Redirecting traffic to the maintenance page

To route traffic to the maintenance page, edit the ingress in place to change `backend -> service -> name` from `book-a-prison-visit-staff-ui` to `maintenance-page-staff-svc`:

```
# Example for dev namespace (will need to replace with 'prod')
kubectl -n visit-someone-in-prison-frontend-svc-dev edit ingress book-a-prison-visit-staff-ui-v1-2
```

### Redirecting traffic back to the application

To restore access to the application, revert the change made to the ingress. So, edit the ingress again and change `backend -> service -> name` from `maintenance-page-staff-svc` back to `book-a-prison-visit-staff-ui`.

### Cleaning up

To remove both the maintenance page service and deployment:

```
# Example for dev namespace (will need to replace with 'prod')
kubectl delete -f kubectl_deploy/ -n visit-someone-in-prison-frontend-svc-dev
```

## Updating the maintenance page
To update the maintenance page, customise the `index.html` file, build and tag a new Docker image and then reference this in the deployment.

* update the `index.html` file
* log in to your ministryofjustice Dockerhub account with the command `docker login`
* work out the next version number for the image - probably just a patch or minor version update
* from this directory (`cd ./maintenance_page`) rebuild the Docker image with the command `docker build . -t ministryofjustice/vsip-maintenance:<new-version-number>`
* push the image to DockerHub with the command `docker push ministryofjustice/vsip-maintenance:<new-version-number>`
* update the image reference in `maintenance_page/kubectl_deploy/maintenance-deploy.yaml`
