# keepthereceipts.org.za frontend

WebFlow export with ES6 to integrate with the backend.

[Import webflow exports](https://www.npmjs.com/package/import-webflow-export) with `import-webflow export.zip`.

## Dev environment

Install dependencies and run a dev server that will build the bundle

    yarn
    yarn dev


## Prod deployment

Bundles are placed in `dist`

    yarn
    yarn build

Set the environment variable at build GOOGLE_TAG_MANAGER_ID to enable Google Tag Manager


## Webflow updates

Import the Webflow export Zip file using `import-webflow zipfile.zip`


## Run the frontend against an alternative backend

Add the querystring parameter apiURL to the url, e.g. visit http://localhost:1234?apiURL=http://localhost:8000/api/purchase_records/
