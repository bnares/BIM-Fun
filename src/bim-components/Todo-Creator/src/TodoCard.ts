import * as OBC from "openbim-components"

export class TodoCard extends OBC.SimpleUIComponent implements OBC.UI{

    public onCardClick = new OBC.Event();
    public onDeleteButton = new OBC.Event();
    uiElement= new OBC.UIElement<{deleteButton: OBC.SimpleUIComponent}>;
    
    set description(value : string){
        const descriptionElement=this.getInnerElement("description") as HTMLParagraphElement;
        descriptionElement.textContent = value; 
    }

    set date(value : Date){
        const date = this.getInnerElement("date") as HTMLParagraphElement;
        date.textContent = value.toDateString() 
    }

    slots:{actionButtons: OBC.SimpleUIComponent<HTMLElement>; deleteButtons: OBC.SimpleUIComponent<HTMLElement>}

    constructor(components : OBC.Components){
        const template = `
        <div class="todo-item" style="display:flex">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; column-gap: 15px; align-items: center;">
                    
                    <span class="material-icons-outlined">
                        handyman
                    </span>
                    
                    <div>
                        <p id="date" style="text-wrap: nowrap; color: #a9a9a9; font-size: var(--font-sm)">Fri, 20 sep</p>
                        <p class="card-to-do-description" id="description">Make anything here as you want, even something longer.</p>
                    </div>
                </div>
                <div data-tooeen-slot="actionButtons"> 
                    data-tooeen-slot we tell the openBim engine that this is a slot with name actionButtons
                </div>
                <div data-tooeen-slot="deleteButtons">
                    
                </div>
            </div>
        </div>
        `
        super(components, template);
        var uiMainElement = this.get();
        uiMainElement.addEventListener("click",()=>{
            this.onCardClick.trigger();
        })

        this.setSlot("actionButtons", new OBC.SimpleUIComponent(this._components));
        const deleteButton = new OBC.Button(this._components);
        deleteButton.materialIcon = "delete";
        
        
        this.slots.actionButtons.addChild(deleteButton);
        
    
        deleteButton.onClick.add(()=>{
            this.onDeleteButton.trigger();
        })



        const simpleUi = new OBC.SimpleUIComponent(this._components);
        this.setSlot("deleteButtons", simpleUi);
        const deleteBtn = new OBC.Button(this._components);
        deleteBtn.materialIcon = "delete";
        deleteBtn.tooltip ="From creator";
        simpleUi.addChild(deleteBtn);
        this.slots.deleteButtons.addChild(deleteBtn);

        deleteBtn.onClick.add(()=>{
            console.log("clicked from TodoCard");
            this.onDeleteButton.trigger();
        })
        
        
    }
    
}