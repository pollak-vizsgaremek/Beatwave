type CardProps = {
  key: number;
  name: string;
  image: string;
  placing: number;
};

const Card = ({ key, name, image, placing }: CardProps) => {
  return (
    <div key={key} className="mr-12">
      <div className={`bg-[url(${image})] rounded-lg p-5 flex flex-col items-center border-2 border-black`}>
        <h1 className="font-bold text-xl">#{placing}</h1>
        <div className="flex flex-col">
          <div className="bg-accent w-24 h-24 mb-4 rounded-full flex items-center justify-center">
            [album pic here]
          </div>
          <div>
            <h2 className="font-semibold text-lg">{name}</h2>
            <p className="text-sm text-gray-400 mt-2">{image}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
