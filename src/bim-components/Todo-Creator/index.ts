import * as OBC from "openbim-components"
import { TodoCard } from "./src/TodoCard";
import * as THREE from "three";
import { ToDo as CameraData } from "./src/ToDo";

type ToDoPriority = "Low" | "Medium" | "High";

interface ToDo{
    Description: string,
    Date: Date,
    fragmentMap : OBC.FragmentIdMap,
    camera : {position: THREE.Vector3, target: THREE.Vector3},
    priority : ToDoPriority
}
export class TodoCreator extends OBC.Component<ToDo[]> implements OBC.UI, OBC.Disposable{
    static uuid : string = "fc0c9282-d5d8-4326-bca8-7d9dba819f61"; 
    enabled: boolean = true;
    onProjectCreated = new OBC.Event<ToDo>();
    private _components : OBC.Components;
    private _list : ToDo[]=[];
    private _todoCard : TodoCard[] = [];
    uiElement = new  OBC.UIElement<{
        activationButton: OBC.Button,
        todoList : OBC.FloatingWindow,
        //deleteBtn : OBC.SimpleUIComponent,
        filterTodoList:OBC.FloatingWindow,
    }>;

    constructor(components : OBC.Components){
        super(components);
        this._components = components;
        this._components.tools.add(TodoCreator.uuid, this)
        this.setUI();
    }

    async dispose(){
        this.uiElement.dispose();
        this._list = [];
        this.enabled = false;
    }

    deleteToDo(toDoCard : TodoCard, todo : ToDo){
        toDoCard.dispose();
        this._list =  this._list.filter(x=>x.fragmentMap != todo.fragmentMap);
    }

    public async setup(){
        var higlighter = await this._components.tools.get(OBC.FragmentHighlighter);
        higlighter.add(`${TodoCreator.uuid}-priority-Low`,[new THREE.MeshStandardMaterial({color:0x59bc59})]);
        higlighter.add(`${TodoCreator.uuid}-priority-Medium`,[new THREE.MeshStandardMaterial({color:0x597cff})]);
        higlighter.add(`${TodoCreator.uuid}-priority-High`,[new THREE.MeshStandardMaterial({color:0xff7676})])
    }
    
    async addTodo(description : string, priority: ToDoPriority){
        if(!this.enabled){return}
        const camera = this._components.camera;
        if(!(camera instanceof OBC.OrthoPerspectiveCamera)){
            throw new Error("This is not orthoperspective camera");
        } 
        var cameraData = new CameraData(this._components);
        var cameraPosition = cameraData.addPosition(camera);

        // const position = new THREE.Vector3();
        // camera.controls.getPosition(position);
        // const target = new THREE.Vector3();
        // camera.controls.getTarget(target);
        // const todoCamera = {position, target};

        const higlighter = await this._components.tools.get(OBC.FragmentHighlighter)
        const todo : ToDo={
            Description: description,
            Date : new Date(),
            fragmentMap: higlighter.selection.select,
            camera: cameraPosition,
            priority
        }
        console.log("todo before adding: ",todo);
        this._list.push(todo);
        const todoCard = new TodoCard(this._components); //creating
        this._todoCard.push(todoCard);
        
        const todoList = this.uiElement.get("todoList");
        
        todoCard.onCardClick.add(()=>{
            
            cameraData.setCameraAndPosition(camera,todo.camera);
            if(Object.keys(todo.fragmentMap).length==0) return;
            higlighter.highlightByID("select", todo.fragmentMap)
            
        })

        todoCard.onDeleteButton.add(()=>{
            console.log("clicked delete button");
            this.deleteToDo(todoCard,todo);
        })
        todoCard.description = description;
        todoCard.date = todo.Date;

        todoList.addChild(todoCard);
        this.onProjectCreated.trigger(todo);
    }

    private setUI(){
        const activationButton = new OBC.Button(this._components);
        activationButton.materialIcon = "construction";

        const newToDoBtn = new OBC.Button(this._components,{name:"Create"});
        const toDoListBtn = new OBC.Button(this._components,{name:"List"});

        activationButton.addChild(newToDoBtn);
        activationButton.addChild(toDoListBtn);

        toDoListBtn.onClick.add(()=>{
            todoList.visible = !todoList.visible;
        })

        newToDoBtn.onClick.add(()=>{
            form.visible = !form.visible
        })

        const openFilterListBtn = new OBC.Button(this._components,{name:"Filter"});
        activationButton.addChild(openFilterListBtn);

        openFilterListBtn.onClick.add(()=>{
            filterTodoList.visible = !filterTodoList.visible;
        })

        const filterTodoList = new OBC.FloatingWindow(this._components);
        this._components.ui.add(filterTodoList);
        filterTodoList.visible = false;
        filterTodoList.title = "Filtered To-Do";

        const filterTodoListToolbar = new OBC.SimpleUIComponent(this._components);
        const filterField = new OBC.TextInput(this._components);
        filterTodoListToolbar.addChild(filterField);
        filterField.label = "Search By Name";
        filterTodoList.addChild(filterTodoListToolbar);

        filterField.innerElements.input.addEventListener("input",()=>{
            var filterFoatingWIndow = this.uiElement.get("filterTodoList");
            var typedText = filterField.innerElements.input.value;
            var data = this._list.filter(x=>x.Description.startsWith(typedText));
            for(var card of this._todoCard){
                var desc = card.getInnerElement("description")?.textContent as string;
                if(desc.startsWith(typedText)){
                    card.visible = true;
                    filterFoatingWIndow.addChild(card);
                }else{
                    card.visible = false;
                    filterFoatingWIndow.removeChild(card);
                }
            }
        })
        
        filterField.onChange.add(()=>{
            console.log("on change");
            var filterFoatingWIndow = this.uiElement.get("filterTodoList");
            filterFoatingWIndow.dispose();
            var typedText = filterField.innerElements.input.value;
            var data = this._list.filter(x=>x.Description.startsWith(typedText));
            
            for(var item of this._list){
                var todoCard = new TodoCard(this._components);
                todoCard.description = item.Description;
                todoCard.date = item.Date;
                filterFoatingWIndow.addChild(todoCard);
                todoCard.visible = false;
                if(data.includes(item)){
                    todoCard.visible = true;
                }
            }

        })

        const todoList = new OBC.FloatingWindow(this._components)
        this._components.ui.add(todoList);
        todoList.visible = false;
        todoList.title = "To-Do List";

        const todoListToolbar = new OBC.SimpleUIComponent(this._components);
        const colorizeBtn = new OBC.Button(this._components);
        todoListToolbar.addChild(colorizeBtn);
        colorizeBtn.materialIcon = "format_collor_fill";
        todoList.addChild(todoListToolbar);
        

        colorizeBtn.onClick.add(async ()=>{
            var higlighter = await this._components.tools.get(OBC.FragmentHighlighter);
            colorizeBtn.active = !colorizeBtn.active
            if(colorizeBtn.active){
                for(const todo of this._list){
                    const fragmentMapLength = Object.keys(todo.fragmentMap).length;
                    if(fragmentMapLength ==0) return;
                    higlighter.highlightByID(`${TodoCreator.uuid}-priority-${todo.priority}`,todo.fragmentMap);
                }
            }else{
                higlighter.clear(`${TodoCreator.uuid}-priority-Low`);
                higlighter.clear(`${TodoCreator.uuid}-priority-Medium`);
                higlighter.clear(`${TodoCreator.uuid}-priority-High`);
            }
        })

        

        var form = new OBC.Modal(this._components);
        form.title = "Add To-Do"
        this._components.ui.add(form);

        const description = new OBC.TextArea(this._components);
        description.label = "Description";
        form.slots.content.addChild(description);

        const priority = new OBC.Dropdown(this._components);
        priority.label = "Priority";
        priority.addOption("Low", "Medium", "High");
        form.slots.content.addChild(priority);

        form.slots.content.get().style.padding = "20px";
        form.slots.content.get().style.display = "flex";
        form.slots.content.get().style.flexDirection = "column";
        form.slots.content.get().style.rowGap = "20px";

        form.onCancel.add(()=>{
            form.visible = false;
        })

        form.onAccept.add(async ()=>{
            await this.addTodo(description.value, priority.value as ToDoPriority);
            description.value = "";
            form.visible = false;
        })

        
        
        this.uiElement.set({activationButton, todoList,filterTodoList});
    }

    get(): ToDo[] {
       return this._list;
    }

    getNumberOfToDos() : number{
        return this._list.length;
    }

}