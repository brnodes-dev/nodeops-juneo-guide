# 🚀 Juneo Validator NodeOps UI: The Zero-CLI Guide

This guide details how to deploy and manage your Juneo Validator Node using the NodeOps UI template. Our application is a dedicated, Dockerized solution designed to make node management simple, reliable, and completely **Zero-CLI**.

---

## 1. Deployment Setup on NodeOps

### 1.1 Login and Access the Marketplace

1.  Navigate to the NodeOps platform at `https://cloud.nodeops.network/`.
2.  If you are not already logged in, click the yellow **Login** button and sign in using your wallet or credentials. You may be prompted to sign a verification message with your wallet (e.g., Rabby Wallet Notification).
3.  Once logged in, click on **Template Marketplace** in the main navigation menu.
4.  In the Marketplace, search for the **Juneo Validator** template.

### 1.2 Configure and Deploy the Validator

1.  Clicking the template will take you to the **Juneo Validator** details page.
2.  Review the **Overview** and **Use Cases** sections, paying attention to the minimum hardware prerequisites (e.g., 2 CPU cores, 2 GiB RAM).
3.  Click the **Deploy Preview** button.
4.  A configuration window will appear (**Configure Juneo Validator**). Allocate the recommended resources:
    * CPU (millicores): 2000 (representing 2 Cores).
    * Memory (MB): 2000 (representing 2 GiB).
5.  Click **Deploy Preview** to start the deployment process.

### 1.3 Accessing Your Running Validator UI

1.  Once the deployment is complete, navigate to the **My Deployments** section. Your new workload (e.g., `cranky-saha0-licg`) will be listed with a **Deployed** status.
2.  Click on your deployment name to view the **Deployment Details**.
3.  To access the web interface (the NodeOps UI), find and click the **Endpoints** link/button. This link opens the interactive web application.
4.  You can also monitor the resource usage of your running node (CPU and Memory) directly from this dashboard.

***

## 2. Node Status and Process Control

The **Node Process Control** section gives you full authority over the internal `juneogo` binary that powers your validator.

### The Node Lifecycle:

* **Initial Status (Process Active):** Upon deployment, you should immediately see the **NODE RUNNING (Process Active)** status in green. This confirms the binary is launched.
* **Stopping the Node:** Click the **Stop Node** button. Wait until the status turns red, showing **NODE OFFLINE (Process Stopped)**.
* **Starting the Node:** If your node is offline, click the **Start Node** button. The status will return to **NODE RUNNING (Process Active)** once the process is back online.

> **Note:** Maintaining an uptime of at least 80% is critical for earning staking rewards on the Juneo network. Use the **Start** button promptly if you see the offline status, unless you are performing scheduled maintenance.

***

## 3. Obtaining Your Staking Keys (Node ID, BLS Key, and Signature)

These unique identifiers are required when you interact with the Juneo Wallet to finalize your staking.

### How to Retrieve the Validator Data:

1.  Navigate to the **Node Information & Status** card.
2.  Your node must be running (status: **NODE RUNNING**).
3.  Click the **Fetch Node ID** button.
4.  Click the **Fetch BLS Key** button to retrieve your validator's unique Public Key.
5.  Click the **Fetch BLS Signature** button to retrieve the Proof of Possession.

> **Action Required:** Copy and safely store these three unique values—**Node ID, BLS Key, and BLS Signature**.

***

## 4. Critical Node Backup and Resiliency

The first action is to **secure your staking keys** (Backup). The last action is knowing how to **restore** them (Resiliency).

### 4.1 Critical Node Backup: Securing Your Node ID

The **Critical: Staking Files Backup** section provides direct download buttons for the three files located in your container's `~/.juneogo/staking` directory:

* `signer.key`: The key needed to sign validator proposals.
* `staker.crt`: Your staker certificate.
* `staker.key`: Your staker private key.

1.  Click **Download** for each of the three files shown.
2.  Store these files immediately in multiple safe, offline locations.

> **⚠️ WARNING:** Losing these files means losing your validator identity and potentially your ability to reclaim rewards.

### 4.2 Node Resiliency: Restoring Your Validator Identity

This section is used for disaster recovery or identity portability.

1.  **Crucial Warning:** You **must stop the Juneo Node process** before beginning file upload. Click **Stop Node** and wait for confirmation.
2.  Navigate to the **Node Restoration** section.
3.  **Upload Backup Files:** Upload the three backup files (`signer.key`, `staker.crt`, and `staker.key`) you previously secured.
4.  **Initiate Restore:** Click the **Upload Files & Restore NodeID** button.
5.  **Verification:** Wait 15 seconds, then click **Fetch Node ID** in the top section. You should see your original, backed-up Node ID, confirming your validator identity has been successfully restored.

***

## 5. Funding, Activation, and Final Step

### 5.1 Funding Your Validator: From Exchange to P-Chain

1.  **Access the Wallet:** In the **Validator Setup & Staking** section, click the **Go to Juneo Wallet & Stake Now!** button.
2.  Follow the instructions on the Juneo Wallet site to create your key phrase and access your dashboard.
3.  **Fund Your Wallet:** Purchase the required JUNE tokens on an exchange (like MEXC).
4.  **Transfer to P-Chain:** Transfer the tokens from the exchange to your JUNE-Chain address, and then perform a **Cross-Chain Transfer** to move them to the **P-Chain** (required for staking).

### 5.2 Configuring and Activating Validation

1.  In your Juneo Wallet, navigate to the **Stake** section and select the **Validate** tab.
2.  **Input Keys:** Paste your Node ID, BLS Key, and BLS Signature, which you retrieved in Section 3.
3.  **Set Stake Details:** Enter the amount of JUNE you wish to stake and set the Validation Period (minimum 14 days).
4.  **Validate and Confirm:** Click the **Validate** button to submit the transaction.

***

## Conclusion: Your Node is Running!

You have successfully deployed, controlled, backed up, and funded your Juneo Validator Node using the easy-to-use NodeOps UI. Remember to always keep your staking files secure and monitor your node's uptime to maximize your rewards!