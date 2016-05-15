@echo off
title JSDOC SCEJS

set jsdocdir=jsdoc 3
set sourcesDir=..\SCEJS\
set outputDir=APIdoc


cd /D %jsdocdir%
echo GENERATING API DOC
jsdoc -t templates/docstrap-master/template -c confSCEJS.json -d ..\%outputDir% ..\%sourcesDir%ArrayGenerator.class.js ..\%sourcesDir%Component.class.js ..\%sourcesDir%Component_GPU.class.js ..\%sourcesDir%Component_Indices.class.js ..\%sourcesDir%Component_Kernel.class.js ..\%sourcesDir%Component_Vfp.class.js ..\%sourcesDir%Component_Work.class.js ..\%sourcesDir%ComponentControllerTransformTarget.class.js ..\%sourcesDir%ComponentKeyboardEvents.class.js ..\%sourcesDir%ComponentMouseEvents.class.js ..\%sourcesDir%ComponentProjection.class.js ..\%sourcesDir%ComponentRenderer.class.js ..\%sourcesDir%ComponentScreenEffects.class.js ..\%sourcesDir%ComponentTransform.class.js ..\%sourcesDir%ComponentTransformTarget.class.js ..\%sourcesDir%Constants.js ..\%sourcesDir%Mesh.class.js ..\%sourcesDir%Node.class.js ..\%sourcesDir%Project.class.js ..\%sourcesDir%SCE.class.js ..\%sourcesDir%SE.class.js ..\%sourcesDir%Stage.class.js ..\%sourcesDir%StormMath.class.js ..\%sourcesDir%SystemEvents.class.js ..\%sourcesDir%Utils.class.js ..\%sourcesDir%VFP.class.js ..\%sourcesDir%WebCLGL.class.js ..\%sourcesDir%WebCLGLBuffer.class.js ..\%sourcesDir%WebCLGLBufferItem.class.js ..\%sourcesDir%WebCLGLKernel.class.js ..\%sourcesDir%WebCLGLKernelProgram.class.js ..\%sourcesDir%WebCLGLUtils.class.js ..\%sourcesDir%WebCLGLVertexFragmentProgram.class.js ..\%sourcesDir%WebCLGLWork.class.js ..\%sourcesDir%Prefabs\SimpleCamera\SimpleCamera.class.js ..\%sourcesDir%Prefabs\Graph\Graph.class.js

echo.
echo.
echo API DOC GENERATED
pause

chrome.exe ..\%outputDir%\SCEJS.html

