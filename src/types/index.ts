interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}


interface UserType extends BaseEntity {
  name: string;
  email: string;
  password: string;
  blogs?: BlogType[];
}

interface BlogType extends BaseEntity {
  title: string;
  content: string;
  authorId: number;
  author: UserType;
}


export {UserType , BlogType}