type CardProps = {
  name: string;
  image: string;
  placing: number;
};

const Card = ({ name, image, placing }: CardProps) => {
  return (
    <div className="mr-12 shrink-0">
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={`bg-cover bg-center rounded-lg p-5 flex flex-col items-center border-2 border-black w-60`}
      >
        <h1 className="font-bold text-xl">#{placing}</h1>
        <div className="flex flex-col">
          <div className="bg-accent w-24 h-24 mb-4 rounded-full flex items-center justify-center">
            [album pic here]
          </div>
          <div>
            <h2 className="font-semibold text-lg">{name}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
