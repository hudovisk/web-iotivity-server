
import { Resource } from './resource-model';

export function registerResource(userId, resourceData) {
    return new Promise(function(resolve, reject) {
        resourceData.owner = userId;
        console.log(resourceData);
        var resource = new Resource(resourceData);
        resource.save(function(err) {
            if(err) {
                if(err.code === 11000) {
                    Resource.update({resourceData.identifier}, {
                        resourceData
                    }, (err, numOfAffected) => {
                        if(err) return reject(err);
                        if(numOfAffected <= 0) {
                            return reject("No resources found");
                        }
                        return resolve();
                    });
                }
                else {
                    return reject(err);
                }
            }
            return resolve();
        });
    });
}

export function getResourcesByUserId(userId) {
    return new Promise(function(resolve, reject) {
        Resource.find({owner: userId})
            .exec(function(err, resources){
                if(err) return reject(err);
                return resolve(resources);
            });
    });
}