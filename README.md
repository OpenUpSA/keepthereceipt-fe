# keepthereceipts.org.za frontend

WebFlow export with ES6 to integrate with the backend.

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

Export and download the Zip file from WebFlow.

Import it into the `src` directory:

    unzip procurement-search.webflow.zip -d src/

Look at what's changed and add the changes to the git repository

     git status
     git add src

Commit the changes and make a pull request.

Add `<script src="js/index.js" defer></script>` just before `</body>`


## Run the frontend against an alternative backend

Add the querystring parameter apiURL to the url, e.g. visit http://localhost:1234?apiURL=http://localhost:8000/api/purchase_records/