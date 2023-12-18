import { MeshBasicMaterial } from "three";
import { IProject, ProjectStatus, UserRole } from "./class/Project"
import { ProjectsManager } from "./class/ProjectsManager"
import * as OBC from "openbim-components";
import * as THREE from "three";
import { FragmentsGroup } from "bim-fragment";
import { TodoCreator } from "./bim-components/Todo-Creator";

function showModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.showModal()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

function closeModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.close()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

const projectsListUI = document.getElementById("projects-list") as HTMLElement
const projectsManager = new ProjectsManager(projectsListUI)

// This document object is provided by the browser, and its main purpose is to help us interact with the DOM.
const newProjectBtn = document.getElementById("new-project-btn")
if (newProjectBtn) {
  newProjectBtn.addEventListener("click", () => {showModal("new-project-modal")})
} else {
  console.warn("New projects button was not found")
}

const projectForm = document.getElementById("new-project-form")
if (projectForm && projectForm instanceof HTMLFormElement) {
  projectForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const formData = new FormData(projectForm)
    const projectData: IProject = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as ProjectStatus,
      userRole: formData.get("userRole") as UserRole,
      finishDate: new Date(formData.get("finishDate") as string)
    }
    try {
      const project = projectsManager.newProject(projectData)
      console.log(project)
      projectForm.reset()
      closeModal("new-project-modal")
    } catch (err) {
      alert(err)
    }
  })
} else {
	console.warn("The project form was not found. Check the ID!")
}

const exportProjectsBtn= document.getElementById("export-projects-btn")
if (exportProjectsBtn) {
  exportProjectsBtn.addEventListener("click", () => {
    projectsManager.exportToJSON()
  })
}

const importProjectsBtn = document.getElementById("import-projects-btn")
if (importProjectsBtn) {
  importProjectsBtn.addEventListener("click", () => {
    projectsManager.importFromJSON()
  })
}

//OPEN BIM COMPONENTS

const viewer = new OBC.Components();

const sceneComponent = new OBC.SimpleScene(viewer);
viewer.scene = sceneComponent;
const scene = sceneComponent.get();
scene.background = null;
sceneComponent.setup();


const viewerContainer = document.getElementById("viewer-container") as HTMLDivElement;
const rendereComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
viewer.renderer = rendereComponent;

const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
viewer.camera = cameraComponent;
cameraComponent.controls.setLookAt(10,10,10,0,0,0);

const raycasterComponent = new OBC.SimpleRaycaster(viewer);
viewer.raycaster = raycasterComponent;

viewer.init();
cameraComponent.updateAspect();
rendereComponent.postproduction.enabled = true;

const ifcLoader = new OBC.FragmentIfcLoader(viewer);
ifcLoader.settings.wasm = {
  path: "https://unpkg.com/web-ifc@0.0.43/",
  absolute: true
}

const highlighter = new OBC.FragmentHighlighter(viewer);
highlighter.setup();

const propetiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
highlighter.events.select.onClear.add(()=>{
  propetiesProcessor.cleanPropertiesList();
})

const classifier = new OBC.FragmentClassifier(viewer);
const classificationWindow = new OBC.FloatingWindow(viewer);
classificationWindow.visible = false;
classificationWindow.title = "Model Groups";
viewer.ui.add(classificationWindow);

const classificationButton = new OBC.Button(viewer);
classificationButton.materialIcon = "account_tree";

classificationButton.onClick.add(()=>{
  //console.log("floating button clicked: ",classificationWindow.visible);
  classificationWindow.visible = !classificationWindow.visible;
  classificationButton.active = classificationButton.visible
})

const dimensions = new OBC.AreaMeasurement(viewer);

viewerContainer.ondblclick = ()=> dimensions.create();
viewerContainer.oncontextmenu = ()=> {
  dimensions.endCreation();
  //dimensions.delete();
};

window.onkeydown = (event)=>{
  //console.log("on key down event: ",event);
  if (event.code === 'Delete' || event.code === 'Backspace') {
    // WORK IN PROGRESS
    // dimensions.delete();
    dimensions.deleteAll();
  }
  
}

async function createModelTree(){
  const fragmentTree = new OBC.FragmentTree(viewer);
  await fragmentTree.init();
  fragmentTree.update([]);
  await fragmentTree.update(["model","storeys","entities"]);
  fragmentTree.onHovered.add((fragmentMap)=>{
    highlighter.highlightByID("hover", fragmentMap);
    
  });
  fragmentTree.onSelected.add((fragmentMap)=>{
    highlighter.highlightByID("select",fragmentMap)
  });
  const tree = fragmentTree.get().uiElement.get("tree");
  return tree;
}


async function onModelLoaded(model : FragmentsGroup){
  try{
    highlighter.update();
    classifier.byModel(model.id.toString(), model);
    classifier.byStorey(model);
    classifier.byEntity(model);
    const tree = await createModelTree();
    await classificationWindow.slots.content.dispose(true);
    classificationWindow.addChild(tree);
    propetiesProcessor.process(model);
    highlighter.events.select.onHighlight.add((fragmentMap)=>{
      //console.log("events highlighter: ",fragmentMap);
      const expressId = [...Object.values(fragmentMap)[0]][0];
      propetiesProcessor.renderProperties(model, Number(expressId));
    })
  }catch(e){
    console.warn("From console: ",e);
  }
}

ifcLoader.onIfcLoaded.add(async (model)=>{
  onModelLoaded(model);
})

const todoCreator = new TodoCreator(viewer);
todoCreator.setup();
todoCreator.onProjectCreated.add((todo)=>{
  console.log("callback to do: ",todo);
})

const toolbar = new OBC.Toolbar(viewer);
toolbar.addChild(
  ifcLoader.uiElement.get("main"),
  propetiesProcessor.uiElement.get("main"),
  dimensions.uiElement.get("main"),
  classificationButton,
  todoCreator.uiElement.get("activationButton"),
)

viewer.ui.addToolbar(toolbar);