/**
 * set a value into an object using dot notation
 * @param object 
 * @param path 
 * @param value 
 */
const Set = (object, path, value) => {
  const pathParts = path.split('.')

  pathParts.forEach((part, index) => {
    if (index === pathParts.length - 1) {
      object[part] = value
    }
    // if it doesnt exist, make it an empty object
    // unless the next part is a pure number - in which case, make it an array
    if (object[part] == null) {
      if (isNaN(pathParts[index + 1])) {
        object[part] = {}
      } else {
        object[part] = []
      }
    }

    object = object[part]
  })

  return object
}

export default Set
