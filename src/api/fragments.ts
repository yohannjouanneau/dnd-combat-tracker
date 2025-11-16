export const MonsterFragments = {
  MonsterBasic: `
      fragment MonsterBasic on Monster {
        name
        dexterity
        hit_points
        image
        armor_class {
          __typename
          ... on ArmorClassDex {
            desc
            type
            value
          }
          ... on ArmorClassNatural {
            desc
            type
            value
          }
          ... on ArmorClassArmor {
            desc
            type
            value
          }
          ... on ArmorClassCondition {
            desc
            type
            value
            condition {
              name
            }
          }
          ... on ArmorClassSpell {
            desc
            type
            value
            spell {
              name
            }
          }
        }
      }
    `,
};
