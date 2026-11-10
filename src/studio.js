export async function createStudio(container,onReady){
 const query=new URLSearchParams(location.search);
 if(query.has('model'))return (await import('./model-review.js')).createModelReview(container,onReady);
 if(query.has('prototype'))return (await import('./prototype-studio.js')).createPrototypeStudio(container,onReady);
 return (await import('./native-studio.js')).createNativeStudio(container,onReady);
}
