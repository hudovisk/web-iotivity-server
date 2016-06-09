
import { Resource } from './resource-model';

export function registerResource(userId, resourceData) {
    return new Promise(function(resolve, reject) {
        resourceData.owner = userId;
        console.log(resourceData);
        // var resource = new Resource(resourceData);
        // resource.save(function(err) {
        //     if(err) return reject(err);
        //     return resolve();
        // });
    });
}

export function getResourcesByUserId(userId) {

}