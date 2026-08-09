$PROJECT_ID="project-1c7dff83-6a39-4797-94c"
$ZONE="us-central1-a"
$MACHINE_TYPE="e2-custom-4-8192"
$IMAGE_FAMILY="ubuntu-2204-lts"
$IMAGE_PROJECT="ubuntu-os-cloud"
$NETWORK_TAGS="http-server,https-server"

# Set project
gcloud config set project $PROJECT_ID

# Create Firewall Rules
gcloud compute firewall-rules create allow-http-https `
    --direction=INGRESS `
    --priority=1000 `
    --network=default `
    --action=ALLOW `
    --rules="tcp:80,tcp:443" `
    --source-ranges=0.0.0.0/0 `
    --target-tags=$NETWORK_TAGS

# Deploy Dataset VM
gcloud compute instances create aletheia-dataset-vm `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --machine-type=$MACHINE_TYPE `
    --network-tier=PREMIUM `
    --metadata-from-file=startup-script=startup_dataset.sh `
    --scopes=https://www.googleapis.com/auth/cloud-platform `
    --tags=$NETWORK_TAGS `
    --image-family=$IMAGE_FAMILY `
    --image-project=$IMAGE_PROJECT `
    --boot-disk-size=50GB `
    --boot-disk-type=pd-balanced

# Deploy Model VM
gcloud compute instances create aletheia-model-vm `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --machine-type=$MACHINE_TYPE `
    --network-tier=PREMIUM `
    --metadata-from-file=startup-script=startup_model.sh `
    --scopes=https://www.googleapis.com/auth/cloud-platform `
    --tags=$NETWORK_TAGS `
    --image-family=$IMAGE_FAMILY `
    --image-project=$IMAGE_PROJECT `
    --boot-disk-size=50GB `
    --boot-disk-type=pd-balanced

# Deploy LLM BiasProbe VM
gcloud compute instances create aletheia-llmbias-vm `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --machine-type=$MACHINE_TYPE `
    --network-tier=PREMIUM `
    --metadata-from-file=startup-script=startup_llmbias.sh `
    --scopes=https://www.googleapis.com/auth/cloud-platform `
    --tags=$NETWORK_TAGS `
    --image-family=$IMAGE_FAMILY `
    --image-project=$IMAGE_PROJECT `
    --boot-disk-size=50GB `
    --boot-disk-type=pd-balanced

# Deploy Granite4 VM
gcloud compute instances create aletheia-granite4-vm `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --machine-type=$MACHINE_TYPE `
    --network-tier=PREMIUM `
    --metadata-from-file=startup-script=startup_granite4.sh `
    --scopes=https://www.googleapis.com/auth/cloud-platform `
    --tags=$NETWORK_TAGS `
    --image-family=$IMAGE_FAMILY `
    --image-project=$IMAGE_PROJECT `
    --boot-disk-size=100GB `
    --boot-disk-type=pd-balanced

Write-Host "Deployment scripts dispatched successfully. Instances are booting up..."
