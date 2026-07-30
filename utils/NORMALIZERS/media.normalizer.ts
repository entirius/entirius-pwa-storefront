const placeholder_width = 600;
const placeholder_height = 600;
//export const image_placeholder = `https://placehold.co/${placeholder_width}x${placeholder_height}/111/ddd/png`;
export const image_placeholder = `https://picsum.photos/seed/picsum/${placeholder_width}/${placeholder_height}?grayscale`;

// ------------------------------------------------------------
// sort_by - sort by position, type, source_set
// KVP - Key Value Pair
// ------------------------------------------------------------
type NORM_MEDIA_DATA_OPTIONS = {
  sort_by?: 'position' | 'type' | 'source_set';
  remove_kvp?: [string, string][];
};

type MEDIA = {
  uri: string;
  width: number;
  height: number;
};

// [ [{uri, width, height}, {uri, width, height}, {uri, width, height}], [{uri, width, height}, {uri, width, height}, {uri, width, height}] ]

function NORM_MEDIA_DATA(
  media: any[],
  options: NORM_MEDIA_DATA_OPTIONS = { sort_by: 'position' }
): MEDIA[][] {
  if (!media) {
    return [
      [
        {
          uri: image_placeholder,
          width: placeholder_width,
          height: placeholder_height,
        },
      ],
    ];
  }

  // resolve options if passed

  // ------------------------------------------------------------
  // remove kvp if passed
  // ------------------------------------------------------------
  if (options.remove_kvp && options.remove_kvp.length) {
    media = media.filter((item) => {
      // check if the item has the key value pair f.e. [['type', 'video']]
      const test = options.remove_kvp!.some(([key, value]) => {
        const itemValue = item[key as keyof typeof item] as unknown as string;
        return itemValue === value;
      });

      // ------------------------------------------------------------
      // if test is true, remove the item
      // ------------------------------------------------------------
      return !test;
    });
  }

  // ------------------------------------------------------------
  // sort by position, type, source_set
  // ------------------------------------------------------------
  if (options.sort_by && media.length) {
    media = media.sort((a, b) => {
      return (
        (a[options.sort_by as keyof typeof a] as number) -
        (b[options.sort_by as keyof typeof b] as number)
      );
    });
  }

  // ------------------------------------------------------------
  // return media
  // ------------------------------------------------------------
  return media.map((item: any) => {
    return item.source_set.map((n: any) => {
      return {
        uri: n.source,
        width: n.width,
        height: n.height,
      };
    });
  });
}

export { NORM_MEDIA_DATA };
