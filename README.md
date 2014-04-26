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

    cd $HOME/code
    git clone https://github.com/bartek/gramework
    npm link $HOME/code/gramework
    
##### start a http://localhost:4000 server 

    npm start

##### build & watch andxyz's test game

    watchify ./test.js -o ./dist/test.js -v

##### build & watch the actual game

    watchify ./main.js -o ./dist/bundled.js -v


Play
====

    npm run-script build
    npm run-script start
