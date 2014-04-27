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

##### download gramework

    cd $HOME/code
    git clone https://github.com/bartek/gramework
    npm link $HOME/code/gramework
    
##### start a http://localhost:4000 server 

    npm start

##### build & watch the actual game

    git checkout master
    git pull
    watchify ./main.js -o ./dist/bundled.js -v

##### build & watch andxyz's playground

    watchify ./test.js -o ./dist/test.js -v

Play
====

    npm run-script build
    npm run-script start
