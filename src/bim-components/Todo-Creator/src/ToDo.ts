import * as OBC from "openbim-components";
import * as THREE from "three";

interface CameraData{
    camera : {position: THREE.Vector3, target: THREE.Vector3},
}
export class ToDo extends OBC.Component<CameraData | null>{
    enabled: boolean = true;
    private _cameraPositions: CameraData | null;
    private _components : OBC.Components;
    constructor(components : OBC.Components){
        super(components);
        this._components = components;
    }
    public addPosition(camera : OBC.OrthoPerspectiveCamera) : {position: THREE.Vector3; target: THREE.Vector3} {
        const position = new THREE.Vector3();
        camera.controls.getPosition(position);
        const target = new THREE.Vector3();
        camera.controls.getTarget(target);
        const todoCamera = {position, target};
        return todoCamera;
    }
    public setCameraAndPosition(camera : OBC.OrthoPerspectiveCamera, todoCamera:{position: THREE.Vector3; target: THREE.Vector3}){
        camera.controls.setLookAt(
            todoCamera.position.x, 
            todoCamera.position.y, 
            todoCamera.position.z, 
            todoCamera.target.x, 
            todoCamera.target.y, 
            todoCamera.target.z, 
            true
        );
    }
    get(): CameraData | null {
        return this._cameraPositions;
    }
}