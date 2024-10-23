import json

MAP_SIZE = 24
FACE_VALUE = 'lightgreen'
GENERATED_FACE_VALUE = 'lightcoral'
PATH = './js/map.json'

"""
  Rotates the given coordinate by 180 degrees by the map's center.
"""
def transform(coord: str) -> str:
  x, y, z, face = coord.split('_')

  if face == 'x':
    return f'{MAP_SIZE-int(x)+1}_{MAP_SIZE-int(y)}_{z}_{face}'

  if face == 'y':
    return f'{MAP_SIZE-int(x)}_{MAP_SIZE-int(y)+1}_{z}_{face}'

  return f'{MAP_SIZE-int(x) }_{MAP_SIZE-int(y)}_{z}_{face}'


"""
  Copies and rotates all the faces with the value FACE_VALUE to the opposite side of the map.
"""
def main():
  with open(PATH, 'r') as f:
    data = json.load(f)

  faces = data['faces']

  for face in list(faces.keys()):
    if faces[face] == GENERATED_FACE_VALUE:
      del faces[face]

  faces_to_transform = [face for face in faces.keys() if faces[face] == FACE_VALUE]

  for face in faces_to_transform:
    faces[transform(face)] = GENERATED_FACE_VALUE

  with open(PATH, 'w') as f:
    json.dump(data, f, indent=2)

if __name__ == '__main__':
  main()