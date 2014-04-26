TOJam9
======

Install
====

    cd ./TOJam9
    npm install
    npm install -g watchify

Build
====
    
    npm run-script build

Develop
====

    npm run-script watch


Secret Andxyz Develop
====
    npm start
    watchify ./test-animations.js -o ./dist/test-animations.js -v
    watchify ./main.js -o ./dist/bundled.js -v


Play
====

    npm run-script build
    npm run-script start
