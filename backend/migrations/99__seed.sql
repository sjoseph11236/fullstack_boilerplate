-- Create some test usrs
INSERT INTO
  users (name, email)
VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com'),
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Brown', 'bob@example.com');

-- Create test assignments
INSERT INTO
  assignments (title, description)
VALUES
  (
    'Basic Skeletal System Quiz',
    'Explore the foundational framework of the human body. This quiz reviews major bones like the femur and skull, their locations, and protective functions. It emphasizes structural roles and introduces key anatomical terms.'
  ),
  (
    'Cardiovascular System Basics',
    'Test your knowledge of how the heart and blood vessels work together to sustain life. This quiz covers the four chambers of the heart, pathways of blood flow, and the functions of arteries, veins, and capillaries.'
  ),
  (
    'Digestive System Overview',
    'Learn how food is broken down and nutrients are absorbed. This quiz introduces the major digestive organs, the roles of enzymes and bile, and the journey from ingestion to absorption in the small intestine.'
  );

-- Create questions for Skeletal System Quiz
INSERT INTO
  questions (assignment_id, prompt, order_index, choices)
SELECT
  a.id,
  q.prompt,
  q.order_index,
  q.choices
FROM
  assignments a
  JOIN (
    SELECT
      'Which bone is the longest in the human body?' AS prompt,
       0 AS order_index,
      'Femur;;Tibia;;Humerus;;Fibula' AS choices
    UNION ALL
    SELECT
      'How many bones are in the adult human body?',
       1,
      '206;;186;;226;;196'
    UNION ALL
    SELECT
      'Which part of the skull protects the brain?',
      2,
      'Cranium;;Mandible;;Maxilla;;Hyoid'
    UNION ALL
    SELECT
      'What is the common name for the clavicle?',
      3,
      'Collarbone;;Wishbone;;Shoulderblade;;Neckbone'
    -- UNION ALL
    -- SELECT
    --   'Explain the difference between compact and spongy bone tissue:',
    --  4,
    --   NULL
  ) q
WHERE
  a.title = 'Basic Skeletal System Quiz';

-- Create questions for Cardiovascular Quiz
INSERT INTO
  questions (assignment_id, prompt,order_index, choices)
SELECT
  a.id,
  q.prompt,
  q.order_index,
  q.choices
FROM
  assignments a
  JOIN (
    SELECT
      'Which chamber of the heart pumps blood to the body?' AS prompt,
       0 AS order_index,
      'Left ventricle;;Right ventricle;;Left atrium;;Right atrium' AS choices
    UNION ALL
    SELECT
      'What is the main function of red blood cells?',
      1,
      'Carry oxygen;;Fight infection;;Form blood clots;;Produce antibodies'
    UNION ALL
    SELECT
      'Which blood vessel carries oxygenated blood?',
      2,
      'Arteries;;Veins;;Capillaries;;Venules'
    UNION ALL
    SELECT
      'How many chambers are in the human heart?',
      3,
      '4;;2;;3;;6'
    -- UNION ALL
    -- SELECT
    --   'Describe the path of blood flow through the heart:',
    --   4,
    --   NULL
  ) q
WHERE
  a.title = 'Cardiovascular System Basics';

-- Create questions for Digestive System Quiz
INSERT INTO
  questions (assignment_id, prompt,order_index, choices)
SELECT
  a.id,
  q.prompt,
  q.order_index,
  q.choices
FROM
  assignments a
  JOIN (
    SELECT
      'Where does chemical digestion begin?' AS prompt,
       0 AS order_index,
      'Mouth;;Stomach;;Small intestine;;Esophagus' AS choices
    UNION ALL
    SELECT
      'Which organ produces bile?',
      1,
      'Liver;;Pancreas;;Gallbladder;;Stomach'
    UNION ALL
    SELECT
      'What is the longest part of the digestive system?',
      2,
      'Small intestine;;Large intestine;;Esophagus;;Stomach'
    UNION ALL
    SELECT
      'Which enzyme breaks down proteins in the stomach?',
      3,
      'Pepsin;;Amylase;;Lipase;;Trypsin'
    -- UNION ALL
    -- SELECT
    --   'Explain the role of villi in the small intestine:',
    --   4,
    --   NULL
  ) q
WHERE
  a.title = 'Digestive System Overview';